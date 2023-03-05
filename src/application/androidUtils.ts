import {getRootDestinationFolder} from './utils'

export function getAppBuildFolder(flavorName?: string, release?: boolean) {
  const buildType = release ? 'release' : 'debug'

  const appPath = `${getRootDestinationFolder()}/android/${flavorName ? `${flavorName}/` : ''}${buildType}`
  return appPath
}
