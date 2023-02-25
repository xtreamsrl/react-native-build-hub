import {Args, Command, Flags} from '@oclif/core'
import {buildIos} from '../application/buildIos'
import {buildAndroid} from '../application/buildAndroid'

export default class Build extends Command {
  static description = 'Create native builds for android and ios'

  static examples = [
    '<%= config.bin %> <%= command.id %> -i',
    '<%= config.bin %> <%= command.id %> -a',
    '<%= config.bin %> <%= command.id %> -all',
  ]

  static flags = {
    ios: Flags.boolean({char: 'i', description: 'Generate ios native build'}),
    android: Flags.boolean({char: 'a', description: 'Generate android native build'}),
    all: Flags.boolean(),
  }

  static args = {
    file: Args.string({description: 'file to read'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Build)

    if (flags.ios) {
      this.log('ios build')
      buildIos()
    } else if (flags.android) {
      this.log('android build')
      buildAndroid()
    } else if (flags.all) {
      buildIos();
      buildAndroid();
      this.log('all build')
    } else {
      this.log('no build')
    }
  }
}
