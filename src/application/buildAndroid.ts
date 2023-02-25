import path from "path";
import { execSync } from "child_process";
import { getAppName, getProjectRootDir, getRootDestinationFolder } from "./utils";


const buildType = "dev";


const androidBuildConfig = {
    "dev": {
      "config": "debug"
    }
  }
;

export function buildAndroid() {
  const { config } = androidBuildConfig[buildType];

  const androidFolder = path.join(getProjectRootDir(), "android");

  execSync(`${androidFolder}/gradlew \
      -Duser.dir=${androidFolder} \
      app:assemble${config} \
    `, { stdio: "inherit" });

  const destinationDir = `${getRootDestinationFolder()}/android/${buildType}`;
  execSync(`rm -rf ${destinationDir} && mkdir -p ${destinationDir}`);
  const app = `${androidFolder}/app/build/outputs/apk/${config}/app-${config}.apk`;
  const destinationApp = `${destinationDir}/${getAppName()}.apk`;
  execSync(`cp -a ${app} ${destinationApp}`);
}
