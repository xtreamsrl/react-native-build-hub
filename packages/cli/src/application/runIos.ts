import childProcess, { execFileSync } from "child_process";
import fs from "fs";
import prompts from "prompts";
import chalk from "chalk";
import { executeCommand, getAppName, getProjectRootDir } from "./utils";
import { buildIos } from "./buildIos";
import { getIosBuildDestination, iosBuildPlatforms, IosPlatform } from "./iosUtils";
import path from "path";
import { getIosFlavors } from "./config";
import logger from "./logger";

// todo default app name improve passing from command line

type Device = {
  state: "Booted" | "shutdown";
  name: string;
  udid: string;
  type: "simulator"; // todo
};

function getDevices(): Device[] {
  const devicesJson = JSON.parse(childProcess.execSync("xcrun simctl list -j devices", { encoding: "utf-8" }));
  return Object.values(devicesJson.devices).flat() as Device[];
}

function getBootedDevices(allDevices: Device[]) {
  return allDevices.filter(d => d.state === "Booted");
}

function checkBuildPresent(buildType: string, target: {
  ext: string;
  buildCmd: string;
  name: string
}, buildId?: string) {
  const { destination } = getIosBuildDestination(target, buildType, buildId);
  return fs.existsSync(destination);
}

function installApp(deviceUdid: string, buildType: string, target: {
  ext: string;
  buildCmd: string;
  name: string
}, buildId?: string) {
  const { destination } = getIosBuildDestination(target, buildType, buildId);
  const res = childProcess.execSync(`xcrun simctl install ${deviceUdid} ${destination}`, { encoding: "utf-8" });
}

function launchApp(deviceUid: string, bundleId: string) {
  childProcess.execSync(`xcrun simctl launch ${deviceUid} ${bundleId}`);
}

function isErrorWithStderr(e: unknown): e is { stderr: { toString(): string } } {
  if (typeof e === "object" && e !== null && "stderr" in e) {
    return typeof (e as any).stderr.toString === "function";
  }
  return false;
}

function launchDevice(deviceUid: string) {
  try {
    childProcess.execSync(["xcrun", "simctl", "boot", deviceUid].join(" "));
  } catch (e) {
    if (isErrorWithStderr(e)) {
      const err = e.stderr.toString();
      if (err.includes("Unable to boot device in current state: Booted")) {
        return;
      }
    }
    throw e;
  }
}

async function promptForDeviceSelection(allDevices: Device[]): Promise<Device[]> {
  const { devices } = await prompts({
    type: "multiselect",
    name: "devices",
    message: "Select the device / emulator you want to use",
    choices: allDevices.map(d => ({
      title: `${chalk.bold(`(${d.type})`)} ${chalk.green(`${d.name}`)} (${
        d.state === "Booted" ? "connected" : "disconnected"
      })`,
      value: d
    })),
    min: 1
  });
  return devices;
}

function waitForBootedDeviceOrTimeout() {
  return new Promise<void>((resolve, reject) => {
    let interval: NodeJS.Timeout | undefined;
    let timeout = setTimeout(() => {
      if (interval) clearInterval(interval);
      reject("timeout");
    }, 20_000);
    interval = setInterval(() => {
      let devices = getDevices();
      let bootedDevices = getBootedDevices(devices);
      if (bootedDevices.length > 0) {
        clearInterval(interval);
        executeCommand(`xcrun simctl bootstatus ${bootedDevices[0].udid}`, { stdio: "ignore" });
        clearTimeout(timeout);
        resolve();
      }
    }, 2_000);
  });
}

export async function runApp(
  buildType?: string,
  iosPlatform: IosPlatform = iosBuildPlatforms.simulator,
  forceBuild?: boolean,
  buildId?: string
) {
  const buildFlavor = getIosFlavors(buildType);

  if (forceBuild || !checkBuildPresent(buildFlavor.scheme, iosPlatform, buildId)) {
    logger.info("Build not present, starting build");
    if (buildId) {
      throw new Error(`The requested build id ${buildId} does not contain an ios build for scheme ${buildFlavor}`);
    }
    buildIos(buildType, iosPlatform);
  } else {
    logger.info("Build already present, skipping build");
  }

  let devices = getDevices();

  if (devices.length === 0) {
    throw new Error("No iOS devices available");
  }

  // todo improve run on device
  executeCommand("open -a Simulator");
  try {
    await waitForBootedDeviceOrTimeout();

  } catch (e) {
  }
  devices = getDevices();

  let bootedDevices = getBootedDevices(devices);

  const devicesToRun: Device[] = [];

  if (bootedDevices.length === 1) {
    devicesToRun.push(bootedDevices[0]);
  } else {
    const requestedDevices = await promptForDeviceSelection(devices);

    for (const requestedDevice of requestedDevices) {
      if (!(requestedDevice.state === "Booted")) {
        launchDevice(requestedDevice.udid);
      }
    }
    // start not connected ones
    devicesToRun.push(...requestedDevices);
  }

  const { destination } = getIosBuildDestination(iosPlatform, buildFlavor.scheme, buildId);

  const bundleID = execFileSync(
    "/usr/libexec/PlistBuddy",
    ["-c", "Print:CFBundleIdentifier", path.join(destination, "Info.plist")],
    {
      encoding: "utf8"
    }
  ).trim();

  for (const device of devicesToRun) {
    const id = device.udid;
    installApp(id, buildFlavor.scheme, iosPlatform, buildId);
    launchApp(id, bundleID);
  }
}
