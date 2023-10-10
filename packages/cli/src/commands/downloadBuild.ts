import RemoteAwareCommand from '../_projectAwareCommand';
import { downloadBuild, getLastBuild } from '../application/cloud/buildsManagement';
import { Flags } from '@oclif/core';
import logger from '../application/logger';

export default class DownloadBuild extends RemoteAwareCommand {
  static description = 'Download all the binary of the given build';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static aliases = ['build:download'];

  static flags = {
    buildId: Flags.string({ description: 'Specify the build id. Can be last or a buildId', default: 'last' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DownloadBuild);
    const buildId = flags.buildId;
    let buildIdToDownload: string;
    if (buildId === 'last') {
      const buildId = await getLastBuild(this.currentProject);
      buildIdToDownload = buildId;
    } else {
      buildIdToDownload = buildId;
    }
    logger.info(`Downloading build ${buildIdToDownload}`);
    await downloadBuild(buildIdToDownload, this.currentProject);
    this.exit(0);
  }
}
