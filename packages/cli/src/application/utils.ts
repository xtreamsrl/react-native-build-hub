import process from 'process';
import fs from 'fs';
import path from 'path';
import { execSync, ExecSyncOptions, ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { ProjectConfiguration } from './cloud/projectsManagement';
import { AzureHubAdapter } from '../adapters/azure';

const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

export function executeCommand(command: string, options?: ExecSyncOptionsWithBufferEncoding) {
  execSync(command, { stdio: 'inherit', ...(options || {}) });
}

export function executeCommandWithOutPut(command: string, options?: ExecSyncOptions) {
  return execSync(command, { encoding: 'utf8', ...(options || {}) }) as string;
}

export function executeCommandAsync(command: string, options?: ExecSyncOptionsWithBufferEncoding) {
  return execAsync(command, options);
}

export function getRootDestinationFolder() {
  return path.join(getProjectRootDir(), '.rn-build-hub');
}

export function getConfigFile() {
  return path.join(getProjectRootDir(), '.rn-build-hub.json');
}

export function getProjectRootDir() {
  // todo improve this
  return process.cwd();
}

export function getAppName() {
  const projectRootDir = getProjectRootDir();

  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRootDir, 'package.json'), 'utf8'));
  // todo default app name improve passing from command line
  return packageJson.name;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRootModuleDir() {
  return path.join(__dirname, '..', '..');
}

export function getApkToolExecutable() {
  return path.join(getRootModuleDir(), 'apktool');
}

export function getUberSignJava() {
  return path.join(getRootModuleDir(), 'uber-apk-signer.jar');
}

export function getBuildFolderByBuildId(buildId: string) {
  return path.join(getRootDestinationFolder(), 'builds', buildId);
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getAdapter(config: ProjectConfiguration) {
  // todo select from configuration and import dynamically
  return new AzureHubAdapter(config.remoteAdapter.config);
}
