import path from 'path'
import {getAppName, getProjectRootDir} from './utils'
import fs from 'fs'

const configFileName = 'rn-enginerc.json'

export type Config = {
  ios: {
    flavors: {
      [key: string]: {
        scheme: string;
        config: string;
        flavorDir: string;
      }
    }
  },
  android?: {
    flavors?: {
      [key: string]: {
        gradleFlavor: string;
      }
    }
  }
}

function getDefaultConfig(): Config {
  return {
    ios: {
      flavors: {
        dev: {
          scheme: getAppName(),
          config: 'Debug',
          flavorDir: 'Debug',
        },
      },
    },
    android: {
      flavors: {
        dev: {
          gradleFlavor: 'debug',
        },
      },
    },
  }
}

export function loadConfig() {
  const configPath = path.join(getProjectRootDir(), configFileName)

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    return config as Config
  } else {
    return getDefaultConfig()
  }

}

const config = loadConfig()

export function getIosFlavors(flavorName: string) {
  return config.ios.flavors[flavorName]
}

export function getAndroidFlavors(flavorName?: string) {
  if(!flavorName){
    return {
      gradleFlavor: flavorName,
    }
  }
  const flavorConfig = config?.android?.flavors?.[flavorName];
  if(flavorConfig){
    return flavorConfig;
  }else {
    return {
      gradleFlavor: flavorName,
    }
  }
}

export default config
