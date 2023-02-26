import path from "path";
import {executeCommand, getAppName, getProjectRootDir, getRootDestinationFolder} from './utils'
import {ux} from "@oclif/core";

const appName = getAppName();

const IOSBuildFlavors = {
  dev: { scheme: appName, config: "Debug", flavorDir: "Debug" }
};

const iosBuildPlatforms = {
  "simulator": {
    "name": "iphonesimulator",
    "ext": "app",
    "buildCmd": "build"
  },
  "iphone": {
    "name": "iphoneos",
    "ext": "ipa",
    "buildCmd": "archive"
  }
};

function installPods() {
  ux.debug('Pod install');
  const iosFolder = path.join(getProjectRootDir(), "ios");
  executeCommand("pod install", { cwd: iosFolder });
}

function _buildIos(buildType: keyof typeof IOSBuildFlavors, platformName: keyof typeof iosBuildPlatforms) {
  const iosFolder = path.join(getProjectRootDir(), "ios");
  const workspacePath = path.join(iosFolder, `${appName}.xcworkspace`);
  const buildFlavor = IOSBuildFlavors[buildType];
  const platform = iosBuildPlatforms[platformName];

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

  console.log("Executing:", buildCommand);
  executeCommand(buildCommand);

  if (platform.buildCmd === "build") {
    const source = `${iosFolder}/DerivedData/${appName}/build/Products/${buildFlavor.flavorDir}-${platform.name}/${appName}.${platform.ext}`;
    const destinationDir = `${getRootDestinationFolder()}/ios/${platform.name}/${buildType}`;
    executeCommand(`mkdir -p ${destinationDir}`);
    const destination = `${destinationDir}/${appName}.app`;
    executeCommand(`rm -rf ${destination}`);
    const copyCommand = `cp -a '${source}' '${destination}'`;
    console.log(`Copying: ${copyCommand}`);
    executeCommand(copyCommand);
    return destination;
  } else { // archive
    // todo
  }

  const generateIpaCommand = `xcodebuild -exportArchive \
      -archivePath '${archivePath}' \
      -exportPath "${iosFolder}/build/Products/IPA" \
      -exportOptionsPlist ${iosFolder}/${appName}/info.plist \
      -allowProvisioningUpdates
    `;
  executeCommand(generateIpaCommand);

}

export function buildIos(buildType: keyof typeof IOSBuildFlavors, platformName: keyof typeof iosBuildPlatforms) {
  installPods();
  _buildIos(buildType, platformName);
}
