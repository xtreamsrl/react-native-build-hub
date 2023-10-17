import fs from 'node:fs';
import RemoteAwareCommand from '../_projectAwareCommand';
import { downloadBuild, getLastBuild, makeCurrentBuild } from '../application/cloud/buildsManagement';
import { Flags } from '@oclif/core';
import logger from '../application/logger';
import { getBuildFolderByBuildId } from '../application/utils';
import { ProjectConfiguration, updateCurrentBuildInFile } from '../application/cloud/projectsManagement';

type RequestedBuildId = 'last' | string & {};
export async function downloadBuildIfNotPresent(buildId: RequestedBuildId, config: ProjectConfiguration) {
  let buildIdToDownload: string;

  if (buildId === "last") {
    const buildId = await getLastBuild(config);
    buildIdToDownload = buildId;
  } else {
    buildIdToDownload = buildId;
  }
  logger.info(`Downloading build ${buildIdToDownload}`);
  if (fs.existsSync(getBuildFolderByBuildId(buildIdToDownload))) {
    logger.info(`Build ${buildIdToDownload} already downloaded`);
  } else {
    await downloadBuild(buildIdToDownload, config);
  }
  return buildIdToDownload;
}

export async function updateCurrentBuild(requestedBuildId: RequestedBuildId, config: ProjectConfiguration) {
  let buildIdToDownload = await downloadBuildIfNotPresent(requestedBuildId, config);

  await makeCurrentBuild(buildIdToDownload);

  await updateCurrentBuildInFile(buildIdToDownload);
}

export default class MakeBuildCurrent extends RemoteAwareCommand {
  static description = 'Make a give build the current one, if not present it will be downloaded';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static aliases = ['build:current'];

  static flags = {
    buildId: Flags.string({ description: 'Specify the build id. Can be last or a buildId', default: 'last' }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MakeBuildCurrent);
    const buildId = flags.buildId;

    const config = this.currentProject;
    await updateCurrentBuild(buildId, config);

    this.exit(0);
  }
}
