import path from 'path'
import {executeCommand, getAppName, getProjectRootDir, getRootDestinationFolder} from './utils'
import {getAndroidFlavors} from './config'
import {getAppBuildFolder} from './androidUtils'

function capitalize(str: string) {
  return str
}

export function buildAndroid(buildType?: string) {
  // todo improve flavor management with debug and release and no flavor usage
  const buildFlavor = getAndroidFlavors(buildType)
  if (!buildFlavor) {
    throw new Error(`No android flavor found for ${buildType}`)
  }
  const {gradleFlavor} = buildFlavor

  const androidFolder = path.join(getProjectRootDir(), 'android')
  // todo handle Debug/release

  const gradleBuildTask = (gradleFlavor && gradleFlavor !== 'debug') ? `install${capitalize(gradleFlavor)}Debug` : 'installDebug'

/*   executeCommand(`${androidFolder}/gradlew \
      -Duser.dir=${androidFolder} \
      app:${gradleBuildTask} \
    `, {stdio: 'inherit'}) */

  const destinationDir = getAppBuildFolder(buildType)
  executeCommand(`rm -rf ${destinationDir} && mkdir -p ${destinationDir}`)
  const destinationFlavorFolder = (gradleFlavor && gradleFlavor !== 'debug') ? `${gradleFlavor}/debug` : 'debug'
  const gradleOutputDir = `${androidFolder}/app/build/outputs/apk/${destinationFlavorFolder}/`
  executeCommand(`cp -R ${gradleOutputDir} ${destinationDir}`)
}
