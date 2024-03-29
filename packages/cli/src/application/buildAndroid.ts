import path from 'path';
import {
  executeCommand,
  executeCommandAsync,
  getApkToolExecutable,
  getProjectRootDir,
  getRootDestinationFolder,
  getUberSignJava,
} from './utils';
import { getAndroidFlavors } from './config';
import { checkBuildPresent, getAndroidIndexJsPath, getAppBuildFolder } from './androidUtils';
import fs from 'fs';
import logger from './logger';

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function rebuildIncrementallyTheApk(
  apkPath: string,
  bundleOutput: string,
  resOutput: string,
  tempAssetBundle: string,
) {
  const tempDir = `${getRootDestinationFolder()}/tmp_${(Math.random() * 1000).toFixed(0)}`;
  const tempApkDir = `${tempDir}/extracted_apk`;

  fs.mkdirSync(tempApkDir, { recursive: true });

  const newApkPath = path.join(tempDir, 'new_build.apk');
  const newSignedApkDir = path.join(tempDir, 'new_signed_apk');

  await executeCommandAsync([getApkToolExecutable(), 'd', apkPath, '-o', tempApkDir, '-f'].join(' '));

  if (!fs.existsSync(path.join(tempApkDir, 'assets'))) {
    fs.mkdirSync(path.join(tempApkDir, 'assets'));
  }

  // todo check bundle name
  await executeCommandAsync(`cp -R ${tempAssetBundle}/* ${tempApkDir}/assets/`);
  await executeCommandAsync(`cp -R ${tempAssetBundle}/res/* ${tempApkDir}/res/`);
  await executeCommandAsync([getApkToolExecutable(), 'b', tempApkDir, '-o', newApkPath].join(' '));

  /*
  params for the signature
       --ks c/Users/rams23/git/test/newRNApp/android/app/debug.keystore
   --ksAlias androiddebugkey
   --ksKeyPass android
   --ksPass android
   */

  // resign apk and align with uber-apk-signer
  await executeCommandAsync(
    `java -jar ${getUberSignJava()} \
     -a ${newApkPath} \
     -o ${newSignedApkDir}`,
  );

  const apkFileName = fs.readdirSync(newSignedApkDir).find(f => f.endsWith('.apk'));
  if (!apkFileName) {
    throw new Error(`No apk found in the new signed apk folder ${newSignedApkDir}`);
  }
  const signedApkPath = path.join(newSignedApkDir, apkFileName);
  await executeCommandAsync(`cp ${apkPath} ${apkPath.replace('.apk', '_old.apk')}`);
  await executeCommandAsync(`cp ${signedApkPath} ${apkPath}`);
}

async function rebuildIncrementally(buildType: string | undefined, release: boolean = false) {
  const tempRNBundleDir = `${getRootDestinationFolder()}/tmp_${(Math.random() * 1000).toFixed(0)}`;

  const tempAssetBundle = path.join(tempRNBundleDir, 'bundle_output');

  const bundleOutput = path.join(tempAssetBundle, 'index.android.bundle');
  const resOutput = path.join(tempAssetBundle, 'res');
  fs.mkdirSync(tempAssetBundle, { recursive: true });
  fs.mkdirSync(tempAssetBundle, { recursive: true });

  logger.info('Creating new bundle and assets');
  executeCommand(
    `node ./node_modules/react-native/cli.js bundle \
    --platform android \
    --dev false \
    --entry-file ${getAndroidIndexJsPath()} \
    --bundle-output ${bundleOutput} \
    --assets-dest ${resOutput}`,
    { cwd: getProjectRootDir() },
  );
  logger.info('Rebuilding apks');

  const buildFolder = getAppBuildFolder(buildType, release);

  await Promise.all(
    fs
      .readdirSync(buildFolder)
      .filter(f => f.endsWith('.apk'))
      .map(async apkFileName => {
        if (apkFileName.endsWith('.apk')) {
          const apkPath = path.join(buildFolder, apkFileName);

          return rebuildIncrementallyTheApk(apkPath, bundleOutput, resOutput, tempAssetBundle);
        }
      }),
  );
}

function getBuildTask(gradleFlavor: string | undefined, release: boolean) {
  const buildType = release ? 'Release' : 'Debug';
  const gradleBuildTask =
    gradleFlavor && gradleFlavor !== 'debug'
      ? `assemble${capitalize(gradleFlavor)}${buildType}`
      : `assemble${buildType}`;
  return gradleBuildTask;
}

export async function buildAndroid(
  flavorName: string | undefined,
  incrementalBuild: boolean = false,
  release: boolean = false,
) {
  const buildFlavor = getAndroidFlavors(flavorName);
  if (!buildFlavor) {
    throw new Error(`No android flavor found for ${flavorName}`);
  }
  const { gradleFlavor } = buildFlavor;

  const androidFolder = path.join(getProjectRootDir(), 'android');

  if (incrementalBuild) {
    if (!checkBuildPresent(flavorName, release)) {
      throw new Error(
        `No build found for ${flavorName} ${release ? 'release' : 'debug'}. Unable to do incremental build`,
      );
    }
    // create a temp directory
    await rebuildIncrementally(flavorName, release);
  } else {
    const gradleBuildTask = getBuildTask(gradleFlavor, release);

    executeCommand(
      `${androidFolder}/gradlew \
      -Duser.dir=${androidFolder} \
      app:${gradleBuildTask} \
    `,
      { stdio: 'inherit' },
    );

    const destinationDir = getAppBuildFolder(flavorName, release);
    const buildType = release ? 'release' : 'debug';
    executeCommand(`rm -rf ${destinationDir} && mkdir -p ${destinationDir}`);
    const destinationFlavorFolder =
      gradleFlavor && gradleFlavor !== 'debug' ? `${gradleFlavor}/${buildType}` : buildType;
    const gradleOutputDir = `${androidFolder}/app/build/outputs/apk/${destinationFlavorFolder}/`;
    executeCommand(`cp -R ${gradleOutputDir} ${destinationDir}`);
  }
}
