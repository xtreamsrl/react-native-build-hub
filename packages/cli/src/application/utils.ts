import process from "process";
import fs from "fs";
import path from "path";
import { execSync, ExecSyncOptions, ExecSyncOptionsWithBufferEncoding } from "child_process";
import { ProjectConfiguration } from "./cloud/projectsManagement";
import { RemoteStorage } from "@rn-buildhub/storage-interface";
import util from "util";
import tryLaunchEmulator
  from "@react-native-community/cli-platform-android/build/commands/runAndroid/tryLaunchEmulator";
import getAdbPath from "@react-native-community/cli-platform-android/build/commands/runAndroid/getAdbPath";

const execAsync = util.promisify(require("child_process").exec);

export function executeCommand(command: string, options?: ExecSyncOptionsWithBufferEncoding) {
  execSync(command, { stdio: "inherit", ...(options || {}) });
}

export function executeCommandWithOutPut(command: string, options?: ExecSyncOptions) {
  return execSync(command, { encoding: "utf8", ...(options || {}) }) as string;
}

export function executeCommandAsync(command: string, options?: ExecSyncOptionsWithBufferEncoding) {
  return execAsync(command, options);
}

export function getRootDestinationFolder() {
  return path.join(getProjectRootDir(), ".rn-build-hub");
}

export function getConfigFile() {
  return path.join(getProjectRootDir(), ".rn-build-hub.json");
}

export function getProjectRootDir() {
  // todo improve this
  return process.cwd();
}

export function getAppName() {
  const projectRootDir = getProjectRootDir();

  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRootDir, "package.json"), "utf8"));
  // todo default app name improve passing from command line
  return packageJson.name;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRootModuleDir() {
  return path.join(__dirname, "..", "..");
}

export function getApkToolExecutable() {
  return path.join(getRootModuleDir(), "apktool");
}

export function getUberSignJava() {
  return path.join(getRootModuleDir(), "uber-apk-signer.jar");
}

function waitFormEmulatorBoot(emulatorName: string): Promise<void> {
  const output = execSync(`${getAdbPath()} -s ${emulatorName} shell getprop sys.boot_completed`);
  if (output.toString().trim() !== "1") {
    return sleep(1000).then(() => waitFormEmulatorBoot(emulatorName));
  } else {
    return Promise.resolve();
  }
}

export async function launchEmulator(adbPath: string, emulatorName: string, port: number, emulatorId:string) {
  const result = await tryLaunchEmulator(adbPath, emulatorName, port);
  if (!result.success) {
    throw new Error("Unable to launch emulator");
  } else {
    await waitFormEmulatorBoot(emulatorId);
    return result;
  }
}

export function getBuildFolderByBuildId(buildId: string) {
  return path.join(getRootDestinationFolder(), "builds", buildId);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getRemoteStorage(config: ProjectConfiguration): RemoteStorage {
  if (!config.remote.name) {
    throw new Error("Remote adapter name is required");
  }
  try {
    const connectorPackage = require(config.remote.name);
    return new connectorPackage.default(config.remote.config);
  } catch (e) {
    throw new Error(`Remote adapter ${config.remote.name} not found`);
  }
}
