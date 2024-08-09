import { executeCommandWithOutPut, getAppName, getBuildFolderByBuildId, getRootDestinationFolder } from "./utils";
import path from "path";

export const iosBuildPlatforms = {
  simulator: {
    name: "iphonesimulator",
    ext: "app",
    buildCmd: "build",
    destination: "generic/platform=iOS Simulator"
  },
  iphone: {
    name: "iphoneos",
    ext: "app",
    buildCmd: "build",
    destination: "generic/platform=iOS"
  }
} as const;

export type IosPlatform = {
  name: "iphonesimulator";
  ext: "app";
  buildCmd: "build";
  destination: string;
} | {
  name: "iphoneos",
  ext: "app",
  buildCmd: "build"
  destination:string;
};

export function getIosBuildDestination(platform: {
  ext: string;
  buildCmd: string;
  name: string
}, buildType: string, config: string, buildId?: string) {
  const baseBuildFolder = buildId ? getBuildFolderByBuildId(buildId) : getRootDestinationFolder();

  // todo handle Debug/release
  const destinationDir = path.join(
    baseBuildFolder,
    "ios",
    `${platform.name}-${buildType}`,
    config
  );
  const destination = path.join(destinationDir, `${getAppName()}.${platform.ext}`);
  return { destinationDir, destination };
}

function getTargetPaths(buildSettings: string) {
  const settings = JSON.parse(buildSettings);

  // Find app in all building settings - look for WRAPPER_EXTENSION: 'app',
  for (const i in settings) {
    const wrapperExtension = settings[i].buildSettings.WRAPPER_EXTENSION;
    if (wrapperExtension === "app") {
      return {
        targetBuildDir: settings[i].buildSettings.TARGET_BUILD_DIR,
        executableFolderPath: settings[i].buildSettings.EXECUTABLE_FOLDER_PATH
      };
    }
  }
  throw new Error("app destination not found");
}

export function getBuildFolder(projectName: string, configuration: string, buildFlavor: string, sdk: string) {
  const buildSettings = executeCommandWithOutPut(
    // todo remove iso and support project
    `xcodebuild \
    -workspace ./ios/${projectName}.xcworkspace \
    -scheme ${buildFlavor} \
    -sdk ${sdk}\
    -configuration ${configuration} \
    -showBuildSettings\
     -json`,
    {
      encoding: "utf8"
    }
  );
  const { executableFolderPath } = getTargetPaths(buildSettings as string);

  return executableFolderPath;
}
