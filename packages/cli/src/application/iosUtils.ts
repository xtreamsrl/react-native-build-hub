import { executeCommandWithOutPut, getAppName, getBuildFolderByBuildId, getRootDestinationFolder } from "./utils";
import path from "path";

export const iosBuildPlatforms = {
  simulator: {
    name: "iphonesimulator",
    ext: "app",
    buildCmd: "build"
  },
  iphone: {
    name: "iphoneos",
    ext: "ipa",
    buildCmd: "archive"
  }
};

export type IosPlatform = {
  name: string;
  ext: string;
  buildCmd: string;
};

export function getIosBuildDestination(platform: {
  ext: string;
  buildCmd: string;
  name: string
}, buildType: string, buildId?: string) {
  const baseBuildFolder = buildId ? getBuildFolderByBuildId(buildId) : getRootDestinationFolder();

  // todo handle Debug/release
  const destinationDir = path.join(
    baseBuildFolder,
    'ios',
    `${platform.name}-${buildType}`,
    'Debug'
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

export function getBuildFolder(projectName: string, release: boolean, buildFlavor: string, sdk: string) {
  const buildSettings = executeCommandWithOutPut(
    // todo remove iso and support project
    `xcodebuild \
    -workspace ./ios/${projectName}.xcworkspace \
    -scheme ${buildFlavor} \
    -sdk ${sdk}\
    -configuration ${release ? "Release" : "Debug"} \
    -showBuildSettings\
     -json`,
    {
      encoding: "utf8"
    }
  );
  const { executableFolderPath } = getTargetPaths(buildSettings as string);

  return executableFolderPath;
}
