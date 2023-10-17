import { Command } from '@oclif/core';
import {
  checkProject,
  ProjectConfiguration,
  RemoteConfig,
} from './application/cloud/projectsManagement';

export default abstract class RemoteAwareCommand extends Command {
  currentProject: ProjectConfiguration = {
    get remote(): RemoteConfig {
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
