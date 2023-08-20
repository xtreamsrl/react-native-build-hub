import ProjectAwareCommand from '../_projectAwareCommand';
import { getAvailableCurrentBuilds, uploadBuilds } from '../application/cloud/buildsManagement';
import { updateCurrentBuildInFile } from '../application/cloud/projectsManagement';

export default class UploadBuild extends ProjectAwareCommand {
  static description = 'Save current android and ios builds to the cloud';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static aliases = ['build:upload'];

  public async run(): Promise<void> {
    const { androidBuilds, iosBuilds } = getAvailableCurrentBuilds();

    const buildId = await uploadBuilds(androidBuilds, iosBuilds, this.currentProject.id);
    await updateCurrentBuildInFile(buildId);
    this.exit(0);
  }
}
