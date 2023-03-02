import childProcess, {execSync} from 'child_process'
import fs from 'fs'
import {getAppName, getProjectRootDir, getRootDestinationFolder} from './utils'
import listAndroidDevices
  from '@react-native-community/cli-platform-android/build/commands/runAndroid/listAndroidDevices'
import tryRunAdbReverse from '@react-native-community/cli-platform-android/build/commands/runAndroid/tryRunAdbReverse'
import adb from '@react-native-community/cli-platform-android/build/commands/runAndroid/adb'
import _getAdbPath from '@react-native-community/cli-platform-android/build/commands/runAndroid/getAdbPath'
import tryLaunchEmulator from '@react-native-community/cli-platform-android/build/commands/runAndroid/tryLaunchEmulator'
import {buildAndroid} from './buildAndroid'
import {getAppBuildFolder} from './androidUtils'
import path from 'path'
import logger from './logger'

function getAdbPath() {
  const androidHome = process.env.ANDROID_HOME
  if (!androidHome) {
    throw new Error('ANDROID_HOME is not set')
  }
  return _getAdbPath()
}

async function getDevices() {

  return listAndroidDevices()
}

function getBootedDevices() {
  const output = childProcess.execSync(
    `${getAdbPath()} devices | tail -n +2 | cut -sf 1`,
  )
  return String(output).trim().split('\n')
}

function checkBuildPresent(buildType?: string) {
  const appPath = getAppBuildFolder(buildType)
  console.debug('appPath', appPath)
  return fs.existsSync(appPath)
}

export function findBestApkInFolder(dir: string, arc?: string) {

  const files = fs.readdirSync(dir)
  // todo debug
  const singleApkFound = files.find(f => f === 'app-debug.apk')
  if (singleApkFound) {
    return path.join(dir, 'app-debug.apk')
  } else {
    if (arc) {
      const apkForArc = files.find(f => f.includes(arc))
      if (apkForArc) {
        return path.join(dir, apkForArc)
      } else {
        throw Error('Unable to find correct apk in' + dir)
      }
    } else {
      throw Error('Unable to find correct apk in' + dir)
    }

  }
}

function installApp(device: string, engineDir: string, buildType?: string) {
  const appDir = getAppBuildFolder(buildType)

  const cpu = adb.getCPU(getAdbPath(), device)

  const apkPath = findBestApkInFolder(appDir, cpu || undefined)

  execSync(`${getAdbPath()} -s ${device} install -r ${apkPath}`)
}

function launchApp(device: string, packageId: string) {
  execSync(
    `${
      getAdbPath()
    } -s ${device} shell monkey -p ${packageId} -c android.intent.category.LAUNCHER 1`,
  )
}

async function getAvailableDevicePort(port = 5552): Promise<number> {
  const devices = adb.getDevices(getAdbPath())
  if (port > 5682) {
    throw new Error('Failed to launch emulator...')
  }
  if (devices.some(d => d.includes(port.toString()))) {
    return await getAvailableDevicePort(port + 2)
  }
  return port
}

function getBundleIdentifier(appBuildFolder: string): string {

  if (fs.existsSync(path.join(appBuildFolder, 'output-metadata.json'))) {
    const id = JSON.parse(fs.readFileSync(path.join(appBuildFolder, 'output-metadata.json'), 'utf-8'))?.applicationId
    if (id) {
      return id
    }
  }

  // todo improve bundle id identifier
  return 'todo'

}

export async function runApp(buildType?: string, port = '8081') {

  if (!checkBuildPresent(buildType)) {
    logger.info('Build not present, starting build');
    await buildAndroid(buildType)
  }else {
    logger.info('Build already present, skipping build');
  }

  // todo improvement: if there is only one device, use it directly
  const device = await listAndroidDevices()

  const appIdentifier = getBundleIdentifier(getAppBuildFolder(buildType))

  if (!device) {
    throw new Error('No android devices available')
  } else {
    if (device.connected) {
      tryRunAdbReverse(port, device.deviceId!)

      installApp(device.deviceId!, getProjectRootDir(), buildType)
      launchApp(device.deviceId!, appIdentifier)

    } else {
      const newEmulatorPort = await getAvailableDevicePort()
      const emulator = `emulator-${newEmulatorPort}`
      const result = await tryLaunchEmulator(getAdbPath(), device.readableName, newEmulatorPort)
      if (result.success) {
        tryRunAdbReverse(port, emulator)

        installApp(emulator, getProjectRootDir(), buildType)
        launchApp(emulator, appIdentifier)

      }
    }
  }

}
