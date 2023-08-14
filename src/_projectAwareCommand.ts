import { Command } from '@oclif/core';
import { checkAuth } from './application/cloud/auth';
import { checkProject, ProjectData } from './application/cloud/projectsManagement';

export default abstract class ProjectAwareCommand extends Command {
  currentProject: ProjectData = {
    get id(): string {
      throw new Error('select a project');
    },
    get name(): string {
      throw new Error('select a project');
    },
  };

  protected init(): Promise<any> {
    return Promise.all([
      checkAuth(),
      checkProject().then(project => {
        this.currentProject = project;
      }),
    ]);
  }
}
