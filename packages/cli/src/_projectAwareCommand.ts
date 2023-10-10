import { Command } from '@oclif/core';
import { checkAuth } from './application/cloud/auth';
import {
  checkProject,
  ProjectConfiguration,
  ProjectData,
  ProjectFileSchema,
  RemoteAdapterConfig,
} from './application/cloud/projectsManagement';

export default abstract class RemoteAwareCommand extends Command {
  currentProject: ProjectConfiguration = {
    get remoteAdapter(): RemoteAdapterConfig {
      throw new Error('select a project');
    },
    get currentBuildId(): string | null {
      throw new Error('select a project');
    },
  };

  protected init(): Promise<any> {
    return Promise.all([
      // checkAuth(),
      checkProject().then(project => {
        this.currentProject = project;
      }),
    ]);
  }
}
