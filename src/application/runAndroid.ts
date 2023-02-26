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

function getBuildFolder(buildType: string) {
  const appPath = `${getRootDestinationFolder()}/android/${buildType}/${getAppName()}.apk`
  return appPath
}

function checkBuildPresent(buildType: string) {
  const appPath = getBuildFolder(buildType)
  return fs.existsSync(appPath)
}

function installApp(device: string, engineDir: string, buildType: string) {
  const appPath = getBuildFolder(buildType)

  execSync(`${getAdbPath()} -s ${device} install -r ${appPath}`)
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

export async function runApp(buildType: string, appId: string, port = '8081') {

  if(!checkBuildPresent(buildType)) {
    buildAndroid(buildType as any);
  }

  const device = await listAndroidDevices()

  if (!device) {
    throw new Error('No android devices available')
  } else {
    if (device.connected) {
      tryRunAdbReverse(port, device.deviceId!)

      installApp(device.deviceId!, getProjectRootDir(), buildType)
      launchApp(device.deviceId!, appId)

    } else {
      const newEmulatorPort = await getAvailableDevicePort()
      const emulator = `emulator-${newEmulatorPort}`
      console.info('Launching emulator...')
      const result = await tryLaunchEmulator(getAdbPath(), device.readableName, newEmulatorPort)
      if (result.success) {
        console.info('Successfully launched emulator.')
        tryRunAdbReverse(port, emulator)

        installApp(emulator, getProjectRootDir(), buildType)
        launchApp(emulator, appId)

      }
    }
  }

}
