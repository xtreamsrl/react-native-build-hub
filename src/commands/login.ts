import { Command } from '@oclif/core';
import { restoreUser, signIn } from '../application/cloud/auth';
import logger from '../application/logger';
import { getAuth } from 'firebase/auth';

export default class Login extends Command {
  static description = 'Login to use cloud services';

  public async run(): Promise<void> {
    try {
      await restoreUser();
    } catch (ex) {
      await signIn();
    }
    logger.info(`Logged in as ${getAuth().currentUser!.email}`);
  }
}
