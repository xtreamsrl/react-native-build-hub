import path from 'path';
import { getAppName, getProjectRootDir, getRootDestinationFolder } from './utils';
import fs from 'fs';

const configFileName = 'rn-incrementalrc.json';

export type Config = {
  ios?: {
    flavors?: {
      [key: string]: {
        scheme: string;
        config: string;
        flavorDir: string;
      };
    };
  };
  android?: {
    flavors?: {
      [key: string]: {
        gradleFlavor: string;
      };
    };
  };
};

export function loadConfig() {
  const configPath = path.join(getProjectRootDir(), configFileName);
  const destinationFolder = getRootDestinationFolder();

  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder);
  }

  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config as Config;
  }
}

const config = loadConfig();

export function getIosFlavors(flavorName?: string) {
  if (!flavorName) {
    return {
      scheme: getAppName(),
      config: 'Debug',
      flavorDir: getAppName(),
    };
  }
  const flavorConfig = config?.ios?.flavors?.[flavorName];
  if (flavorConfig) {
    return flavorConfig;
  } else {
    return {
      scheme: flavorName,
      config: 'Debug',
      flavorDir: flavorName,
    };
  }
}

export function getAndroidFlavors(flavorName?: string) {
  if (!flavorName) {
    return {
      gradleFlavor: flavorName,
    };
  }
  const flavorConfig = config?.android?.flavors?.[flavorName];
  if (flavorConfig) {
    return flavorConfig;
  } else {
    return {
      gradleFlavor: flavorName,
    };
  }
}

export default config;
