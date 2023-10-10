import { getProjectRootDir, getRootDestinationFolder } from './utils';
import path from 'path';
import fs from 'fs';

export function getAppBuildFolder(flavorName?: string, release?: boolean) {
  const buildType = release ? 'release' : 'debug';

  const appPath = `${getRootDestinationFolder()}/android/${flavorName ? `${flavorName}/` : 'default/'}${buildType}`;
  return appPath;
}

export function getAndroidIndexJsPath() {
  const androidSpecific = path.join(getProjectRootDir(), 'index.android.js');
  if (fs.existsSync(androidSpecific)) {
    return androidSpecific;
  } else {
    return path.join(getProjectRootDir(), 'index.js');
  }
}

export function checkBuildPresent(buildFlavor?: string, release?: boolean) {
  const appPath = getAppBuildFolder(buildFlavor, release);
  return fs.existsSync(appPath);
}
