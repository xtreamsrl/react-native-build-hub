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
    flavor: Flags.string({ char: 'f', description: 'Specify flavor to build' }),
    release: Flags.boolean({ description: 'Optimized release build' }),
    incremental: Flags.boolean({ char: 'I', description: 'Incremental build', default: false }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Build);

    const shouldBuildAndroid = flags.android;
    const shouldBuildIos = flags.ios;
    const buildFlavor = flags.flavor;
    const release = flags.release;
    const incremental = flags.incremental;

    const start = performance.now();

    if (shouldBuildIos) {
      logger.info('Building ios app');
      buildIos(buildFlavor, iosBuildPlatforms.simulator);
    }
    if (shouldBuildAndroid) {
      logger.info('Building android');
      await buildAndroid(buildFlavor, incremental, release);
    }
    logger.info(`Build finished in ${((performance.now() - start) / 1000).toFixed(1)} seconds`);
  }
}
