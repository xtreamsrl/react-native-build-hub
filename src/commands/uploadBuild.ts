import path from 'node:path';
import fs from 'node:fs';

import { iosBuildPlatforms } from '../application/iosUtils';
import ProjectAwareCommand from '../_projectAwareCommand';
import { getRootDestinationFolder } from '../application/utils';
import { Build, uploadBuilds } from '../application/cloud/buildsManagement';

export default class UploadBuild extends ProjectAwareCommand {
  static description = 'Save current android and ios builds to the cloud';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static aliases = ['build:upload'];

  public async run(): Promise<void> {
    const androidBuilds: Build[] = [];
    const androidFolder = path.join(getRootDestinationFolder(), 'android');
    if (fs.existsSync(androidFolder)) {
      const flavorsFolders = fs.readdirSync(androidFolder);
      for (const flavorFolder of flavorsFolders) {
        const debugBuildPath = path.join(androidFolder, flavorFolder, 'debug');
        if (fs.existsSync(debugBuildPath)) {
          androidBuilds.push({
            device: 'all',
            flavor: flavorFolder,
            release: false,
            debug: true,
            type: 'debug',
            path: debugBuildPath,
          });
        }
      }
    }
    const iosBuilds: Build[] = [];
    const iosFolder = path.join(getRootDestinationFolder(), 'ios');
    if (fs.existsSync(iosFolder)) {
      const flavorsFolders = fs.readdirSync(iosFolder);
      for (const flavorFolder of flavorsFolders) {
        const [deviceType, ...flavor] = flavorFolder.split('-');
        const debugBuildPath = path.join(iosFolder, flavorFolder, 'Debug');
        if (fs.existsSync(debugBuildPath) && deviceType === iosBuildPlatforms.simulator.name) {
          iosBuilds.push({
            device: 'iphoneSimulator',
            flavor: flavor.join('-'),
            release: false,
            debug: true,
            type: 'debug',
            path: debugBuildPath,
          });
        }
      }
    }

    await uploadBuilds(androidBuilds, iosBuilds, this.currentProject.id);
    this.exit(0);
  }
}
