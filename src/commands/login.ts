import { Command } from '@oclif/core';
import { restoreUser, signIn } from '../application/cloud/auth';

export default class Login extends Command {
  static description = 'Login to use cloud services';

  public async run(): Promise<void> {
    try {
      await restoreUser();
    } catch (ex) {
      console.log('Failed to restore user', ex);
      await signIn();
    }
  }
}
