import childProcess, { execSync } from "child_process";
import process from "process";
import { getAppName, getProjectRootDir, getRootDestinationFolder } from "./utils";

const appName = getAppName();
// todo default app name improve passing from command line

const appId = "com.newrnarctest";

const androidBuildConfig = {
  dev: {
    config: "debug"
  }
};

function getAdbPath() {
  const androidHome = process.env.ANDROID_HOME;
  if (!androidHome) {
    throw new Error("ANDROID_HOME is not set");
  }
  return `${androidHome}/platform-tools/adb`;
}

function getBootedDevices() {
  const output = childProcess.execSync(
    `${getAdbPath()} devices | tail -n +2 | cut -sf 1`
  );
  return String(output).trim().split("\n");
}

function installApp(device: string, engineDir: string, buildType: string) {
  const appPath = `${getRootDestinationFolder()}/android/${buildType}/${getAppName()}.apk`;

  execSync(`${getAdbPath()} -s ${device} install -r ${appPath}`);
}

function launchApp(device: string, packageId: string) {
  execSync(
    `${
      getAdbPath()
    } -s ${device} shell monkey -p ${packageId} -c android.intent.category.LAUNCHER 1`
  );
}

const bootedDevices = getBootedDevices();

if (bootedDevices.length === 0) {
  throw new Error("No booted devices found");
  // todo improve boot device automatically
}

const id = bootedDevices[0];

installApp(id, getProjectRootDir(), "dev");
launchApp(id, appId);
