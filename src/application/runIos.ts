import childProcess from 'child_process';
import process from 'process';
import { getAppName, getProjectRootDir } from "./utils";

const appName = getAppName();
// todo default app name improve passing from command line

const appId = 'org.reactjs.native.example.newRNArcTest';

console.log(process.cwd());

const iosBuildPlatforms = {
  simulator: {
    name: 'iphonesimulator',
    ext: 'app',
    buildCmd: 'build',
  },
  android: {
    name: 'android',
    ext: 'apk',
  },
  iphone: {
    name: 'iphoneos',
    ext: 'ipa',
    buildCmd: 'archive',
  },
};

function getDevices() {
  const devicesJson = JSON.parse(
    childProcess.execSync('xcrun simctl list -j devices', {encoding: 'utf-8'}),
  );
  return Object.values(devicesJson.devices).flat();
}

function getBootedDevicesIds(allDevices: any[]) {
  const bootedDevices = allDevices.filter(d => d.state === 'Booted');
  return bootedDevices.map(d => d.udid);
}

function installApp(
  deviceUdid: string,
  engineDir: string,
  buildType: string,
  target: any,
) {
  const appPath = `${engineDir}/app_builds/${target.name}/${buildType}/${appName}.${target.ext}`;

  childProcess.execSync(`xcrun simctl install ${deviceUdid} ${appPath}`);
}

function launchApp(deviceUdid: string, bundleId: string) {
  childProcess.execSync(`xcrun simctl launch ${deviceUdid} ${bundleId}`);
}

const devices = getDevices();

const id = getBootedDevicesIds(devices)[0];
console.debug('devices', id);

installApp(id, getProjectRootDir(), 'dev', iosBuildPlatforms.simulator);
launchApp(id, appId);
