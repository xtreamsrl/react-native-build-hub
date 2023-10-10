import chalk from 'chalk';
import { createProject, getAvailableProjects, saveProjectData } from '../application/cloud/projectsManagement';
import AuthenticatedCommand from '../_authenticatedCommand';
import prompts from 'prompts';
import logger from '../application/logger';

export default class AddUserToProject extends AuthenticatedCommand {
  static description = 'select an existing cloud project';

  static aliases = ['project:select'];

  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(AddUserToProject);

    // todo
    this.exit(0);
  }
}
