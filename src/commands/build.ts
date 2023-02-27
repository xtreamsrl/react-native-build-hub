import {Args, Command, Flags} from '@oclif/core'
import {buildIos} from '../application/buildIos'
import {buildAndroid} from '../application/buildAndroid'
import {getAppName} from '../application/utils'

export default class Build extends Command {
  static description = 'Create native builds for android and ios'

  static examples = [
    '<%= config.bin %> <%= command.id %> -i -f=dev',
    '<%= config.bin %> <%= command.id %> -a -f=prod',
    '<%= config.bin %> <%= command.id %> -all',
  ]

  static flags = {
    ios: Flags.boolean({char: 'i', description: 'Generate ios native build'}),
    android: Flags.boolean({char: 'a', description: 'Generate android native build'}),
    all: Flags.boolean({description: 'Generate both ios and android native build'}),
    flavor: Flags.string({char: 'f', description: 'Specify flavor to build', default:'dev'}),
  }

  static args = {
    file: Args.string({description: 'file to read'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Build)

    const shouldBuildAndroid = flags.android ?? flags.all;
    const shouldBuildIos = flags.ios ?? flags.all;
    const buildFlavor = flags.flavor;

    this.log('Build app', getAppName());

    if (shouldBuildIos) {
      this.log('Build ios')
      buildIos(buildFlavor, 'simulator');
    }
    if (shouldBuildAndroid) {
      this.log('Building android')
      // build release and debug?
      buildAndroid(buildFlavor);
    }
  }
}
