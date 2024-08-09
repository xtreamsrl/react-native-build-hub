import childProcess, { execFileSync } from 'child_process';
import fs from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';
import { executeCommand, getAppName, getProjectRootDir } from './utils';
import { buildIos } from './buildIos';
import { getIosBuildDestination, iosBuildPlatforms, IosPlatform } from './iosUtils';
import { default as getDevicesRNCLI } from '@react-native-community/cli-platform-ios/build/tools/listIOSDevices';
import path from 'path';
import { getIosFlavors } from './config';
import logger from './logger';

// todo default app name improve passing from command line

type Device = {
  state: 'Booted' | 'shutdown';
  name: string;
  udid: string;
  type: 'simulator' | 'device'; // todo
  iosVersion?: string;
};

export interface SimulatorDeviceType {
  lastBootedAt: string;
  dataPath: string;
  dataPathSize: number;
  logPath: string;
  udid: string;
  isAvailable: boolean;
  logPathSize: number;
  deviceTypeIdentifier: string;
  state: 'Booted' | 'shutdown';
  name: string;
}

function getIosSimulatorsDevices(): Device[] {
  const devicesJson = JSON.parse(childProcess.execSync('xcrun simctl list -j devices', { encoding: 'utf-8' }));
  return (Object.values(devicesJson.devices).flat() as SimulatorDeviceType[]).map(d => ({
    type: 'simulator',
    state: d.state,
    udid: d.udid,
    name: d.name
  }));
}

async function getIosPhysicalDevices(): Promise<Device[]> {
  const devices = await getDevicesRNCLI();
  return devices
    .filter(d => d.type === 'device' || d.type === 'catalyst')
    .map(d => {
      return {
        state: 'Booted',
        name: d.name,
        udid: d.udid,
        type: 'device',
        iosVersion: d.version
      };
    });
}

function getBootedDevices(allDevices: Device[]) {
  return allDevices.filter(d => d.state === 'Booted');
}

function checkBuildPresent(
  buildType: string,
  config: string,
  target: {
    ext: string;
    buildCmd: string;
    name: string;
  },
  buildId?: string
) {
  const { destination } = getIosBuildDestination(target, buildType,config, buildId);
  return fs.existsSync(destination);
}

function isVersionGreaterThen17(iosVersion: string) {
  return parseInt(iosVersion) >= 17;
}

function installApp(device: Device, destination: string) {
  if (device.type === 'device') {
    if (device.iosVersion && isVersionGreaterThen17(device.iosVersion)) {
      // for ios version greater or equal 17 ios-deploy is not supporter we need to use the
      // new devicectl tool inside xcrun
      childProcess.execSync(`xcrun devicectl device install app --device ${device.udid} ${destination}`);
    } else {
      childProcess.execSync(`ios-deploy ${device.udid} --debug --bundle ${destination}`, {
        encoding: 'utf-8'
      });
    }

  } else {
    const res = childProcess.execSync(`xcrun simctl install ${device.udid} ${destination}`, { encoding: 'utf-8' });
  }
}

function launchApp(device: Device, bundleId: string,  destination: string) {
  console.log(device);
  if (device.type === 'device') {
    if (device.iosVersion && isVersionGreaterThen17(device.iosVersion)) {
      // for ios version greater or equal 17 ios-deploy is not supporter we need to use the
      // new devicectl tool inside xcrun
      console.log(`xcrun devicectl device process launch --device ${device.udid} ${bundleId}`)
      childProcess.execSync(`xcrun devicectl device process launch --device ${device.udid} ${bundleId}`);
    } else {
      // do nothing, ios-deploy will already launch the application
    }

  } else {
    childProcess.execSync(`xcrun simctl launch ${device.udid} ${bundleId}`);
  }
}

function isErrorWithStderr(e: unknown): e is { stderr: { toString(): string } } {
  if (typeof e === 'object' && e !== null && 'stderr' in e) {
    return typeof (e as any).stderr.toString === 'function';
  }
  return false;
}

function launchDevice(deviceUid: string) {
  try {
    childProcess.execSync(['xcrun', 'simctl', 'boot', deviceUid].join(' '));
  } catch (e) {
    if (isErrorWithStderr(e)) {
      const err = e.stderr.toString();
      if (err.includes('Unable to boot device in current state: Booted')) {
        return;
      }
    }
    throw e;
  }
}

async function promptForDeviceSelection(allDevices: Device[]): Promise<Device[]> {
  const { devices } = await prompts({
    type: 'multiselect',
    name: 'devices',
    message: 'Select the device / emulator you want to use',
    choices: allDevices.map(d => ({
      title: `${chalk.bold(`(${d.type})`)} ${chalk.green(`${d.name}`)} (${
        d.state === 'Booted' ? 'connected' : 'disconnected'
      })`,
      value: d
    })),
    min: 1
  });
  return devices;
}

function waitForBootedSimulatorOrTimeout() {
  return new Promise<void>((resolve, reject) => {
    let interval: NodeJS.Timeout | undefined;
    let timeout = setTimeout(() => {
      if (interval) clearInterval(interval);
      reject('timeout');
    }, 20_000);
    interval = setInterval(() => {
      let devices = getIosSimulatorsDevices();
      let bootedDevices = getBootedDevices(devices);
      if (bootedDevices.length > 0) {
        clearInterval(interval);
        executeCommand(`xcrun simctl bootstatus ${bootedDevices[0].udid}`, { stdio: 'ignore' });
        clearTimeout(timeout);
        resolve();
      }
    }, 2_000);
  });
}

export async function runApp(
  buildType?: string,
  config?:string,
  iosPlatform: IosPlatform = iosBuildPlatforms.simulator,
  forceBuild?: boolean,
  buildId?: string,
  destinationPlatformEnrichment?:string
) {
  const buildFlavor = getIosFlavors(buildType);

  if (forceBuild || !checkBuildPresent(buildFlavor.scheme, config || buildFlavor.config, iosPlatform, buildId)) {
    logger.info('Build not present, starting build');
    if (buildId) {
      throw new Error(`The requested build id ${buildId} does not contain an ios build for scheme ${buildFlavor}`);
    }
    buildIos(buildType,config, iosPlatform, destinationPlatformEnrichment);
  } else {
    logger.info('Build already present, skipping build');
  }

  let devices: Device[] = [];
  if (iosPlatform.name === iosBuildPlatforms.simulator.name) {
    devices = getIosSimulatorsDevices();
  } else {
    devices = await getIosPhysicalDevices();
  }

  if (devices.length === 0) {
    throw new Error('No iOS devices available');
  }

  if (iosPlatform.name === iosBuildPlatforms.simulator.name) {
    // todo improve run on device
    executeCommand('open -a Simulator');
    try {
      await waitForBootedSimulatorOrTimeout();
    } catch (e) {
    }
    devices = getIosSimulatorsDevices();
  }

  let bootedDevices = getBootedDevices(devices);

  const devicesToRun: Device[] = [];

  if (bootedDevices.length === 1) {
    devicesToRun.push(bootedDevices[0]);
  } else {
    const requestedDevices = await promptForDeviceSelection(devices);

    for (const requestedDevice of requestedDevices) {
      if (!(requestedDevice.state === 'Booted') && requestedDevice.type === 'simulator') {
        launchDevice(requestedDevice.udid);
      }
    }
    // start not connected ones
    devicesToRun.push(...requestedDevices);
  }

  const { destination } = getIosBuildDestination(iosPlatform, buildFlavor.scheme, config || buildFlavor.config,  buildId);

  for (const device of devicesToRun) {
    installApp(device, destination);
    const bundleID = execFileSync(
      '/usr/libexec/PlistBuddy',
      ['-c', 'Print:CFBundleIdentifier', path.join(destination, 'Info.plist')],
      {
        encoding: 'utf8'
      }
    ).trim();
    launchApp(device, bundleID, destination);
  }
}
