import childProcess, {execFileSync} from 'child_process'
import fs from 'fs'
import prompts from 'prompts'
import chalk from 'chalk'
import {executeCommand, getAppName, getProjectRootDir} from './utils'
import {buildIos} from './buildIos'
import {getIosBuildDestination, iosBuildPlatforms, IosPlatform} from './iosUtils'
import path from 'path'
import {getIosFlavors} from './config'
import logger from './logger'

// todo default app name improve passing from command line

type Device = {
  state: 'Booted' | 'shutdown';
  name: string;
  udid: string;
  type: 'simulator'; // todo
}

function getDevices(): Device[] {
  const devicesJson = JSON.parse(
    childProcess.execSync('xcrun simctl list -j devices', {encoding: 'utf-8'}),
  )
  return Object.values(devicesJson.devices).flat() as Device[]
}

function getBootedDevices(allDevices: Device[]) {
  return allDevices.filter(d => d.state === 'Booted');
}

function checkBuildPresent(
  buildType: string,
  target: any,
) {
  const {destination} = getIosBuildDestination(
    target,
    buildType,
  )
  return fs.existsSync(destination)
}

function installApp(
  deviceUdid: string,
  buildType: string,
  target: any,
) {
  const {destination} = getIosBuildDestination(
    target,
    buildType,
  )
  executeCommand(`xcrun simctl install ${deviceUdid} ${destination}`)
}

function launchApp(deviceUid: string, bundleId: string) {
  childProcess.execSync(`xcrun simctl launch ${deviceUid} ${bundleId}`)
}

function launchDevice(deviceUid: string) {
  executeCommand(['xcrun', 'simctl', 'boot', deviceUid].join(' '))

}

async function promptForDeviceSelection(allDevices: Device[]): Promise<Device[]> {
  const {
    devices,
  } = await prompts({
    type: 'multiselect',
    name: 'devices',
    message: 'Select the device / emulator you want to use',
    choices: allDevices.map(d => ({
      title: `${chalk.bold(`(${d.type})`)} ${chalk.green(`${d.name}`)} (${d.state === 'Booted' ? 'connected' : 'disconnected'})`,
      value: d,
    })),
    min: 1,
  })
  return devices
}

export async function runApp(buildType?: string, iosPlatform: IosPlatform = iosBuildPlatforms.simulator) {

  const buildFlavor = getIosFlavors(buildType)

  if (!checkBuildPresent(buildFlavor.scheme, iosPlatform)) {
    logger.info('Build not present, starting build');
    buildIos(buildType, iosPlatform)
  } else {
    logger.info('Build already present, skipping build');
  }

  const devices = getDevices()

  if (devices.length === 0) {
    throw new Error('No iOS devices available');
  }

  // todo improve run on device
  executeCommand('open -a Simulator');

  let bootedDevices = getBootedDevices(devices);

  const devicesToRun: Device[] = []

  if (bootedDevices.length === 1) {
    devicesToRun.push(bootedDevices[0])
  } else {
    const requestedDevices = await promptForDeviceSelection(devices)

    for (const requestedDevice of requestedDevices) {
      if (!(requestedDevice.state === 'Booted')) {
        launchDevice(requestedDevice.udid)
      }
    }
    // start not connected ones
    devicesToRun.push(...requestedDevices)

  }

  const {destination} = getIosBuildDestination(
    iosPlatform,
    buildFlavor.scheme,
  )

  const bundleID = execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print:CFBundleIdentifier', path.join(destination, 'Info.plist')], {
    encoding: 'utf8',
  }).trim()

  for (const device of devicesToRun) {
    const id = device.udid
    installApp(id, buildFlavor.scheme, iosPlatform)
    launchApp(id, bundleID)
  }

}
