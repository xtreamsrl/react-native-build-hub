import { Command, Flags } from '@oclif/core';
import { buildIos } from '../application/buildIos';
import { buildAndroid } from '../application/buildAndroid';
import { iosBuildPlatforms } from '../application/iosUtils';
import logger from '../application/logger';

export default class Build extends Command {
  static description = 'Create native builds for android and ios';

  static examples = [
    '<%= config.bin %> <%= command.id %> -i -f=dev',
    '<%= config.bin %> <%= command.id %> -a -f=prod',
    '<%= config.bin %> <%= command.id %> -a -f=prod --release',
    '<%= config.bin %> <%= command.id %> -a --release',
    '<%= config.bin %> <%= command.id %> -a --incremental',
  ];

  static flags = {
    ios: Flags.boolean({ char: 'i', description: 'Generate ios native build' }),
    android: Flags.boolean({ char: 'a', description: 'Generate android native build' }),
    flavor: Flags.string({ char: 'f', description: 'Specify flavor/schema to build' }),
    config: Flags.string({ char: 'c', description: 'Specify the config to build' }),
    destination: Flags.string({ char: 'd', description: 'Append this to the standard destination platform, like arch=x86_64 for rosetta emulator' }),
    release: Flags.boolean({ description: 'Optimized release build', default: false }),
    incremental: Flags.boolean({ char: 'I', description: 'Incremental build', default: false }),
    iosPlatform: Flags.string({
      description: 'Specify the ios platform to run on',
      options: ['simulator', 'device'],
      default: 'simulator',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build);

    const shouldBuildAndroid = flags.android;
    const shouldBuildIos = flags.ios;
    const buildFlavor = flags.flavor;
    const release = flags.release;
    const config = flags.config;
    const incremental = flags.incremental;
    const destination = flags.destination;
    let iosPlatform = flags.iosPlatform === 'simulator' ? iosBuildPlatforms.simulator : iosBuildPlatforms.iphone;

    const start = performance.now();

    if (shouldBuildIos) {
      logger.info('Building ios app');
      buildIos(buildFlavor, config, iosPlatform, destination);
    }
    if (shouldBuildAndroid) {
      logger.info('Building android');
      await buildAndroid(buildFlavor, incremental, release);
    }
    logger.info(`Build finished in ${((performance.now() - start) / 1000).toFixed(1)} seconds`);
    this.exit(0);
  }
}
