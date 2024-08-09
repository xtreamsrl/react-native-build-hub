import path from "path";
import { executeCommand, getAppName, getProjectRootDir, getRootDestinationFolder } from "./utils";
import { ux } from "@oclif/core";
import { getBuildFolder, getIosBuildDestination, iosBuildPlatforms, IosPlatform } from "./iosUtils";
import { getIosFlavors } from "./config";
import logger from "./logger";

const appName = getAppName();

function installPods() {
  ux.debug("Pod install");
  const iosFolder = path.join(getProjectRootDir(), "ios");
  executeCommand("pod install", { cwd: iosFolder });
}

function _buildIos(schema?: string, config = "Debug", platform: IosPlatform = iosBuildPlatforms.simulator, destinationPlatformEnrichment?: string) {
  const iosFolder = path.join(getProjectRootDir(), "ios");
  const workspacePath = path.join(iosFolder, `${appName}.xcworkspace`);
  const buildFlavor = getIosFlavors(schema);
  if (!buildFlavor) {
    throw new Error(`No build flavor found for ${schema}`);
  }

  logger.log("builfing config", config);
  const archivePath = `${iosFolder}/build/Products/${appName}.xcarchive`;

  const buildCommand = `RCT_NO_LAUNCH_PACKAGER=true xcodebuild \
      -workspace "${workspacePath}" \
      -scheme "${buildFlavor.scheme}" \
      -configuration ${config || buildFlavor.config} \
      -destination '${platform.destination}${destinationPlatformEnrichment ? `,${destinationPlatformEnrichment}` : ""}' \
      -sdk ${platform.name} \
      -archivePath '${archivePath}' \
      -derivedDataPath ${iosFolder}/DerivedData/${appName} \
      ${platform.buildCmd}
    `;

  executeCommand(buildCommand);

  // todo handle Debug/release
  const appFolder = getBuildFolder(getAppName(), config, buildFlavor.flavorDir, platform.name);
  const source = `${iosFolder}/DerivedData/${appName}/build/Products/${config}-${platform.name}/${appFolder}`;
  const { destinationDir, destination } = getIosBuildDestination(platform, buildFlavor.flavorDir, config);

  executeCommand(`mkdir -p ${destinationDir}`);
  executeCommand(`rm -rf ${destination}`);
  const copyCommand = `cp -a '${source}' '${destination}'`;
  executeCommand(copyCommand);
  return destination;

}

export function buildIos(schema?: string, config = "Debug", platform: IosPlatform = iosBuildPlatforms.simulator, destination?: string) {
  // installPods();
  _buildIos(schema, config, platform, destination);
}
