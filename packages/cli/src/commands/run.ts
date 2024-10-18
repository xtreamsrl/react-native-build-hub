import { Flags } from '@oclif/core';
import { runApp as runAndroid } from '../application/runAndroid';
import { runApp as runIos } from '../application/runIos';
import { startMetro, checkIsMetroRunning } from '../application/metroManager';
import logger from '../application/logger';
import { iosBuildPlatforms } from '../application/iosUtils';
import { downloadBuildIfNotPresent } from './makeBuildCurrent';
import MaybeRemoteAwareCommand from "../_maybeProjectAwareCommand";

export default class Run extends MaybeRemoteAwareCommand {
  static description = 'Run the native app';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
    android: Flags.boolean({ char: 'a', description: 'Run the android app' }),
    ios: Flags.boolean({ char: 'i', description: 'Run the ios app' }),
    flavor: Flags.string({ char: 'f', description: 'Specify the android flavor or the ios scheme to build' }),
    config: Flags.string({ char: 'c', description: 'Specify the config to build' }),
    destination: Flags.string({ char: 'd', description: 'Append this to the standard destination platform, like arch=x86_64 for rosetta emulator' }),
    verbose: Flags.boolean({ description: 'Verbose output' }),
    arch: Flags.string({ char: 'A', description: 'Specify the architecture to build' }),
    iosPlatform: Flags.string({
      description: 'Specify the ios platform to run on',
      options: ['simulator', 'device'],
      default: 'simulator',
    }),
    forceBuild: Flags.boolean({ aliases: ['fb', 'force-build'], description: 'Force a native rebuild' }),
    buildId: Flags.string({
      aliases: ['id'],
      description: 'Specify the build id. Can be local, last or a buildId',
      default: undefined,
    }),
  };

  static args = {
    // file: Args.string({description: 'file to read'}),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Run);

    const shouldRunAndroid = flags.android ?? flags.all;
    const shouldRunIos = flags.ios ?? flags.all;
    const buildFlavor = flags.flavor;
    const config = flags.config;
    const forceBuild = flags.forceBuild;
    let buildId = flags.buildId;
    let destination = flags.destination;
    let arch = flags.arch
    let iosPlatform = flags.iosPlatform === 'simulator' ? iosBuildPlatforms.simulator : iosBuildPlatforms.iphone;

    logger.setVerbose(flags.verbose);
    const start = performance.now();
    logger.info('Checking if metro is running...');

    if (buildId && forceBuild) {
      throw new Error('You cannot specify a buildId and force a rebuild at the same time');
    }

    if (buildId) {
      if (!this.currentProject.remote){
        throw new Error('Please run the init command and configure a remote project to run a specific build id')
      }
      logger.info(`Requested to run specific id ${buildId}`);
      buildId = await downloadBuildIfNotPresent(buildId, this.currentProject);
    }

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
      await runAndroid(buildFlavor, undefined, forceBuild, buildId);
    }
    if (shouldRunIos) {
      logger.info(`Running ios app ${buildFlavor ? `with flavor ${buildFlavor}` : ''}`);
      await runIos(buildFlavor!,config, iosPlatform,  forceBuild, buildId, destination, arch);
    }
    logger.info(`Run finished in ${((performance.now() - start) / 1000).toFixed(1)} seconds`);
    this.exit(0);
  }
}
