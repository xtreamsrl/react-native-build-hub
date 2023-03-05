import { Args, Command, Flags } from '@oclif/core';
import { runApp as runAndroid } from '../application/runAndroid';
import { runApp as runIos } from '../application/runIos';
import { startMetro, checkIsMetroRunning } from '../application/metroManager';
import logger from '../application/logger';
import { iosBuildPlatforms } from '../application/iosUtils';

export default class Run extends Command {
  static description = 'Run the native app';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    android: Flags.boolean({ char: 'a', description: 'Run the android app' }),
    ios: Flags.boolean({ char: 'i', description: 'Run the ios app' }),
    flavor: Flags.string({ char: 'f', description: 'Specify flavor to build' }),
    verbose: Flags.boolean({ description: 'Verbose output' }),
  };

  static args = {
    // file: Args.string({description: 'file to read'}),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);

    const shouldRunAndroid = flags.android ?? flags.all;
    const shouldRunIos = flags.ios ?? flags.all;
    const buildFlavor = flags.flavor;

    logger.setVerbose(flags.verbose);
    const start = performance.now();
    logger.info('Checking if metro is running...');

    const isMetroRunning = await checkIsMetroRunning();
    if (!isMetroRunning) {
      logger.info('Metro is not running. Starting Metro');
      await startMetro();
      logger.info('Metro started correctly');
    } else {
      logger.info('Metro is already running. Skipping metro start.');
    }

    if (shouldRunAndroid) {
      logger.info(`Running android app ${buildFlavor ? `with flavor ${buildFlavor}` : ''}`);
      await runAndroid(buildFlavor);
    }
    if (shouldRunIos) {
      logger.info(`Running ios app ${buildFlavor ? `with flavor ${buildFlavor}` : ''}`);
      await runIos(buildFlavor!, iosBuildPlatforms.simulator);
    }
    logger.info(`Run finished in ${((performance.now() - start) / 1000).toFixed(1)} seconds`);
  }
}
