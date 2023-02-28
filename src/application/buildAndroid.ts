import path from 'path'
import {
  executeCommand,
  getApkToolExecutable,
  getAppName,
  getProjectRootDir,
  getRootDestinationFolder,
  getUberSignJava,
} from './utils'
import {getAndroidFlavors} from './config'
import {getAppBuildFolder} from './androidUtils'
import fs from 'fs'
import {findBestApkInFolder} from './runAndroid'

function capitalize(str: string) {
  return str
}

export function buildAndroid(buildType?: string, incrementalBuild: boolean = false) {
  // todo improve flavor management with debug and release and no flavor usage
  const buildFlavor = getAndroidFlavors(buildType)
  if (!buildFlavor) {
    throw new Error(`No android flavor found for ${buildType}`)
  }
  const {gradleFlavor} = buildFlavor

  const androidFolder = path.join(getProjectRootDir(), 'android')
  // todo handle Debug/release

  if (incrementalBuild) {
    // todo check previous build existance
    // create a temp directory
    const tempDir = `${getRootDestinationFolder()}/tmp_${(Math.random()*1000).toFixed(0)}`;
    const tempApkDir = `${tempDir}/extracted_apk`;

    const tempAssetBundle = path.join(tempDir, 'bundle_output')
    fs.mkdirSync(tempAssetBundle, {recursive: true});

    const bundleOutput = path.join(tempDir, 'bundle_output/index.android.bundle')
    const resOutput = path.join(tempDir, 'bundle_output/res')

    fs.mkdirSync(tempApkDir, {recursive: true});
    fs.mkdirSync(tempAssetBundle, {recursive: true});

    const apkPath = findBestApkInFolder(getAppBuildFolder(buildType));

    const newApkPath = path.join(tempDir, 'new_build.apk');
    const newSignedApkDir = path.join(tempDir, 'new_signed_apk');

    executeCommand([getApkToolExecutable(), 'd', apkPath, '-o', tempApkDir, '-f'].join(' '));
    executeCommand(`react-native bundle \
    --platform android \
    --dev false \
    --entry-file index.js \
    --bundle-output ${bundleOutput} \
    --assets-dest ${resOutput}`);

    if(!fs.existsSync(path.join(tempApkDir, 'assets'))){
      fs.mkdirSync(path.join(tempApkDir, 'assets'));
    }

    // todo check bundle name
    executeCommand(`cp -R ${tempAssetBundle}/* ${tempApkDir}/assets/`);
    executeCommand(`cp -R ${tempAssetBundle}/res/* ${tempApkDir}/res/`);
    executeCommand([getApkToolExecutable(), 'b', tempApkDir, '-o', newApkPath].join(' '));

    /*
    params for the signature
         --ks c/Users/rams23/git/test/newRNApp/android/app/debug.keystore
     --ksAlias androiddebugkey
     --ksKeyPass android
     --ksPass android
     */

    // resign apk and align with uber-apk-signer
    executeCommand(
      `java -jar ${getUberSignJava()} \
     -a ${newApkPath} \
     -o ${newSignedApkDir}`
    );

    const apkFileName = fs.readdirSync(newSignedApkDir).find(f=>f.endsWith('.apk'));
    if(!apkFileName){
      throw new Error(`No apk found in the new signed apk folder ${newSignedApkDir}`);
    }
    const signedApkPath = path.join(newSignedApkDir, apkFileName);
    executeCommand(`cp ${apkPath} ${apkPath.replace('.apk', '_old.apk')}`);
    executeCommand(`cp ${signedApkPath} ${apkPath}`);

  } else {
    const gradleBuildTask = (gradleFlavor && gradleFlavor !== 'debug') ? `install${capitalize(gradleFlavor)}Debug` : 'installDebug'

    executeCommand(`${androidFolder}/gradlew \
      -Duser.dir=${androidFolder} \
      app:${gradleBuildTask} \
    `, {stdio: 'inherit'})

    const destinationDir = getAppBuildFolder(buildType)
    executeCommand(`rm -rf ${destinationDir} && mkdir -p ${destinationDir}`)
    const destinationFlavorFolder = (gradleFlavor && gradleFlavor !== 'debug') ? `${gradleFlavor}/debug` : 'debug'
    const gradleOutputDir = `${androidFolder}/app/build/outputs/apk/${destinationFlavorFolder}/`
    executeCommand(`cp -R ${gradleOutputDir} ${destinationDir}`)
  }

}
