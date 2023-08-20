import fs from 'node:fs';
import ProjectAwareCommand from '../_projectAwareCommand';
import { downloadBuild, getLastBuild, makeCurrentBuild } from '../application/cloud/buildsManagement';
import { Flags } from '@oclif/core';
import logger from '../application/logger';
import { getBuildFolderByBuildId } from '../application/utils';
import { updateCurrentBuildInFile } from '../application/cloud/projectsManagement';

export default class MakeBuildCurrent extends ProjectAwareCommand {
  static description = 'Make a give build the current one, if not present it will be downloaded';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static aliases = ['build:current'];

  static flags = {
    buildId: Flags.string({ description: 'Specify the build id. Can be last or a buildId', default: 'last' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MakeBuildCurrent);
    const buildId = flags.buildId;
    let buildIdToDownload: string;
    if (buildId === 'last') {
      const build = await getLastBuild(this.currentProject.id);
      buildIdToDownload = build.id;
    } else {
      buildIdToDownload = buildId;
    }
    logger.info(`Downloading build ${buildIdToDownload}`);
    if (fs.existsSync(getBuildFolderByBuildId(buildIdToDownload))) {
      logger.info(`Build ${buildIdToDownload} already downloaded`);
    } else {
      await downloadBuild(buildIdToDownload);
    }

    await makeCurrentBuild(buildIdToDownload);

    await updateCurrentBuildInFile(buildIdToDownload);

    this.exit(0);
  }
}
