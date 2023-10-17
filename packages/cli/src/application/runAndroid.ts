import childProcess, { execSync } from 'child_process';
import fs from 'fs';
import { getAppName, getProjectRootDir, getRootDestinationFolder, launchEmulator } from "./utils";
import listAndroidDevices from '@react-native-community/cli-platform-android/build/commands/runAndroid/listAndroidDevices';
import tryRunAdbReverse from '@react-native-community/cli-platform-android/build/commands/runAndroid/tryRunAdbReverse';
import adb from '@react-native-community/cli-platform-android/build/commands/runAndroid/adb';
import _getAdbPath from '@react-native-community/cli-platform-android/build/commands/runAndroid/getAdbPath';
import { buildAndroid } from './buildAndroid';
import { checkBuildPresent, getAppBuildFolder } from './androidUtils';
import path from 'path';
import logger from './logger';

function getAdbPath() {
  const androidHome = process.env.ANDROID_HOME;
  if (!androidHome) {
    throw new Error('ANDROID_HOME is not set');
  }
  return _getAdbPath();
}

async function getDevices() {
  return listAndroidDevices();
}

function getBootedDevices() {
  const output = childProcess.execSync(`${getAdbPath()} devices | tail -n +2 | cut -sf 1`);
  return String(output).trim().split('\n');
}

export function findBestApkInFolder(dir: string, arc?: string) {
  const files = fs.readdirSync(dir);
  // todo debug
  const singleApkFound = files.find(f => f.endsWith('.apk'));
  if (singleApkFound) {
    return path.join(dir, singleApkFound);
  } else {
    if (arc) {
      const apkForArc = files.find(f => f.includes(arc));
      if (apkForArc) {
        return path.join(dir, apkForArc);
      } else {
        throw Error('Unable to find correct apk in' + dir);
      }
    } else {
      throw Error('Unable to find correct apk in' + dir);
    }
  }
}

function installApp(device: string, engineDir: string, buildType?: string, buildId?:string) {
  const appDir = getAppBuildFolder(buildType, false, buildId);

  const cpu = adb.getCPU(getAdbPath(), device);

  const apkPath = findBestApkInFolder(appDir, cpu || undefined);

  execSync(`${getAdbPath()} -s ${device} install -r ${apkPath}`);
}

function launchApp(device: string, packageId: string) {
  execSync(`${getAdbPath()} -s ${device} shell monkey -p ${packageId} -c android.intent.category.LAUNCHER 1`);
}

async function getAvailableDevicePort(port = 5552): Promise<number> {
  const devices = adb.getDevices(getAdbPath());
  if (port > 5682) {
    throw new Error('Failed to launch emulator...');
  }
  if (devices.some(d => d.includes(port.toString()))) {
    return await getAvailableDevicePort(port + 2);
  }
  return port;
}

function getBundleIdentifier(appBuildFolder: string): string {
  if (fs.existsSync(path.join(appBuildFolder, 'output-metadata.json'))) {
    const id = JSON.parse(fs.readFileSync(path.join(appBuildFolder, 'output-metadata.json'), 'utf-8'))?.applicationId;
    if (id) {
      return id;
    }
  }

  // todo improve bundle id identifier
  return 'todo';
}

function installAndLaunch(port: string, deviceId: string, buildType: string | undefined, appIdentifier: string, buildId?: string) {
  tryRunAdbReverse(port, deviceId);

  logger.info('Installing app...');
  installApp(deviceId, getProjectRootDir(), buildType, buildId);
  logger.info('Launching app...');
  launchApp(deviceId, appIdentifier);
}

export async function runApp(buildFlavor?: string, port = '8081', forceBuild?: boolean, buildId?: string) {
  if (forceBuild || !checkBuildPresent(buildFlavor,false, buildId)) {
    logger.info('Build not present, starting build');
    if(buildId) {
      throw new Error(`The requested build id ${buildId} does not contain an android build for flavor ${buildFlavor}`);
    }
    await buildAndroid(buildFlavor);
  } else {
    logger.info('Build already present, skipping build');
  }

  // todo improvement: if there is only one device, use it directly
  const device = await listAndroidDevices();

  const appIdentifier = getBundleIdentifier(getAppBuildFolder(buildFlavor, false, buildId));

  if (!device) {
    throw new Error('No android devices available');
  } else {
    if (device.connected) {
      installAndLaunch(port, device.deviceId!, buildFlavor, appIdentifier, buildId);
    } else {
      const newEmulatorPort = await getAvailableDevicePort();
      const emulator = `emulator-${newEmulatorPort}`;
      const result = await launchEmulator(getAdbPath(), device.readableName, newEmulatorPort, emulator);
      if (result.success) {
        installAndLaunch(port, emulator, buildFlavor, appIdentifier, buildId);
      }
    }
  }
}
