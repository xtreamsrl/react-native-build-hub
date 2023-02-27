import {getAppName, getRootDestinationFolder} from './utils'

export function getAppBuildFolder(buildType: string) {
  // todo add debug
  const appPath = `${getRootDestinationFolder()}/android/${buildType}/debug`
  return appPath
}
