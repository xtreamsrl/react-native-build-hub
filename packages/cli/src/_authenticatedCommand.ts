import { Command } from '@oclif/core';
import { checkAuth } from './application/cloud/auth';

export default abstract class AuthenticatedCommand extends Command {
  protected init(): Promise<any> {
    return checkAuth();
  }
}
