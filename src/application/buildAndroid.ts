import path from "path";
import {executeCommand, getAppName, getProjectRootDir, getRootDestinationFolder} from './utils'



const androidBuildConfig = {
    "dev": {
      "config": "debug"
    }
  }
;

export function buildAndroid(buildType: keyof typeof androidBuildConfig) {
  const { config } = androidBuildConfig[buildType];

  const androidFolder = path.join(getProjectRootDir(), "android");

  executeCommand(`${androidFolder}/gradlew \
      -Duser.dir=${androidFolder} \
      app:assemble${config} \
    `, { stdio: "inherit" });

  const destinationDir = `${getRootDestinationFolder()}/android/${buildType}`;
  executeCommand(`rm -rf ${destinationDir} && mkdir -p ${destinationDir}`);
  const app = `${androidFolder}/app/build/outputs/apk/${config}/app-${config}.apk`;
  const destinationApp = `${destinationDir}/${getAppName()}.apk`;
  executeCommand(`cp -a ${app} ${destinationApp}`);
}
