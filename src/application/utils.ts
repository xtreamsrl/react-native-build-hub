import process from 'process';
import fs from 'fs';
import path from 'path';
import { execSync, ExecSyncOptionsWithBufferEncoding } from 'child_process';
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);
export function executeCommand(command: string, options?: ExecSyncOptionsWithBufferEncoding) {
  execSync(command, { stdio: 'inherit', ...(options || {}) });
}

export function executeCommandAsync(command: string, options?: ExecSyncOptionsWithBufferEncoding) {
  return execAsync(command, options);
}

export function getRootDestinationFolder() {
  return path.join(getProjectRootDir(), '.rn-incremental');
}

export function getProjectRootDir() {
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
