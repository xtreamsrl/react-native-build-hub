import path from 'path';
import { executeCommand, getAppName, getProjectRootDir, getRootDestinationFolder } from './utils';
import { ux } from '@oclif/core';
import { getBuildFolder, getIosBuildDestination, iosBuildPlatforms, IosPlatform } from './iosUtils';
import { getIosFlavors } from './config';

const appName = getAppName();

function installPods() {
  ux.debug('Pod install');
  const iosFolder = path.join(getProjectRootDir(), 'ios');
  executeCommand('pod install', { cwd: iosFolder });
}

function _buildIos(buildType?: string, platform: IosPlatform = iosBuildPlatforms.simulator) {
  const iosFolder = path.join(getProjectRootDir(), 'ios');
  const workspacePath = path.join(iosFolder, `${appName}.xcworkspace`);
  const buildFlavor = getIosFlavors(buildType);
  if (!buildFlavor) {
    throw new Error(`No build flavor found for ${buildType}`);
  }

  const archivePath = `${iosFolder}/build/Products/${appName}.xcarchive`;

  const buildCommand = `RCT_NO_LAUNCH_PACKAGER=true xcodebuild \
      -workspace "${workspacePath}" \
      -scheme "${buildFlavor.scheme}" \
      -configuration ${buildFlavor.config} \
      -sdk ${platform.name} \
      -archivePath '${archivePath}' \
      -derivedDataPath ${iosFolder}/DerivedData/${appName} \
      ${platform.buildCmd}
    `;

  executeCommand(buildCommand);

  if (platform.buildCmd === 'build') {
    // todo handle Debug/release
    const appFolder = getBuildFolder(getAppName(), false, buildFlavor.flavorDir, platform.name);
    const source = `${iosFolder}/DerivedData/${appName}/build/Products/Debug-${platform.name}/${appFolder}`;
    const { destinationDir, destination } = getIosBuildDestination(platform, buildFlavor.flavorDir);

    executeCommand(`mkdir -p ${destinationDir}`);
    executeCommand(`rm -rf ${destination}`);
    const copyCommand = `cp -a '${source}' '${destination}'`;
    executeCommand(copyCommand);
    return destination;
  } else {
    // archive
    // todo
    const generateIpaCommand = `xcodebuild -exportArchive \
      -archivePath '${archivePath}' \
      -exportPath "${iosFolder}/build/Products/IPA" \
      -exportOptionsPlist ${iosFolder}/${appName}/info.plist \
      -allowProvisioningUpdates
    `;
    executeCommand(generateIpaCommand);
  }
}

export function buildIos(buildType?: string, platform: IosPlatform = iosBuildPlatforms.simulator) {
  // installPods();
  _buildIos(buildType, platform);
}
