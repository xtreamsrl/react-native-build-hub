import chalk from 'chalk';
import { createProject, getAvailableProjects, saveProjectData } from '../application/cloud/projectsManagement';
import AuthenticatedCommand from '../_authenticatedCommand';
import prompts from 'prompts';
import logger from '../application/logger';

export default class SelectProject extends AuthenticatedCommand {
  static description = 'select an existing cloud project';

  static aliases = ['project:select'];

  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SelectProject);

    const projects = await getAvailableProjects();
    const selectedProject = await prompts({
      type: 'select',
      name: 'project',
      message: 'Select the project you want to use',
      choices: projects.map(p => ({
        title: `${chalk.bold(p.name)} (${p.id})`,
        value: p,
      })),
    });
    if (selectedProject.project) {
      logger.info(`Selected project ${chalk.bold(selectedProject.project.name)} (${selectedProject.project.id})`);
      await saveProjectData(selectedProject.project.name, selectedProject.project.id);
    }
    this.exit(0);
  }
}
