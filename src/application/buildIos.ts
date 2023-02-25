import path from "path";
import { execSync } from "child_process";

const appName = "newRNArcTest";

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

const ROOT_PROJECT_FOLDER = path.join(__dirname, "..", "..");

function installPods() {
  console.log("\n*** Installing Pods ***");
  const iosFolder = path.join(ROOT_PROJECT_FOLDER, "ios");
  execSync("pod install", { cwd: iosFolder });
}

function _buildIos() {
  const buildType = "dev";
  const platformName = "simulator";
  console.log("\n*** Building iOS ***");
  const iosFolder = path.join(ROOT_PROJECT_FOLDER, "ios");
  const workspacePath = path.join(iosFolder, `${appName}.xcworkspace`);
  const buildFlavor = IOSBuildFlavors[buildType];
  const platform = iosBuildPlatforms[platformName];
  const version = "1.0.0";
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
  execSync(buildCommand, { stdio: "inherit" });


  if (platform.buildCmd === "build") {
    const source = `${iosFolder}/DerivedData/${appName}/build/Products/${buildFlavor.flavorDir}-${platform.name}/${appName}.${platform.ext}`;
    const destinationDir = `${ROOT_PROJECT_FOLDER}/app_builds/${platform.name}/${buildType}`;
    execSync(`mkdir -p ${destinationDir}`);
    const destination = `${destinationDir}/${appName}.app`;
    execSync(`rm -rf ${destination}`);
    const copyCommand = `cp -a '${source}' '${destination}'`;
    console.log(`Copying: ${copyCommand}`);
    execSync(copyCommand);
    return destination;
  } else { // archive

  }

  const generateIpaCommand = `xcodebuild -exportArchive \
      -archivePath '${archivePath}' \
      -exportPath "${iosFolder}/build/Products/IPA" \
      -exportOptionsPlist ${iosFolder}/${appName}/info.plist \
      -allowProvisioningUpdates
    `;
  execSync(generateIpaCommand, { stdio: "inherit" });

}

export function buildIos() {
  installPods();
  _buildIos();
}
