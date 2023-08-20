import { Args } from '@oclif/core';
import logger from '../application/logger';
import { createProject, saveProjectData } from '../application/cloud/projectsManagement';
import AuthenticatedCommand from '../_authenticatedCommand';

export default class CreateProject extends AuthenticatedCommand {
  static description = 'create a new cloud project';

  static aliases = ['project:create', 'create-project'];

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {};

  static args = {
    name: Args.string({ description: 'The name of the project', required: true }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(CreateProject);

    const projectName = args.name;
    if (!projectName) {
      logger.error('Project name is required');
    } else {
      const id = await createProject(projectName);
      await saveProjectData(projectName, id);
    }
    this.exit(0);
  }
}
