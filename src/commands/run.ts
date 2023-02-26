import {Args, Command, Flags} from '@oclif/core'
import {runApp as runAndroid} from '../application/runAndroid'
import {runApp as runIos} from '../application/runIos'
import {startMetro, checkIsMetroRunning} from '../application/metroManager'

export default class Run extends Command {
  static description = 'Run the native app'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    android: Flags.boolean({char: 'a', description: 'Run the android app'}),
    ios: Flags.boolean({char: 'i', description: 'Run the ios app'}),
  }

  static args = {
    // file: Args.string({description: 'file to read'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Run)

    const shouldRunAndroid = flags.android ?? flags.all
    const shouldRunIos = flags.ios ?? flags.all
    this.log('Checking if metro is running...');

    const isMetroRunning = await checkIsMetroRunning()
    if (!isMetroRunning) {
      this.log('Metro is not running. Starting Metro')
      await startMetro()
    }

    if (shouldRunAndroid) {
      // todo build and appId
      runAndroid('dev', 'com.newrnarctest')
    }
    if (shouldRunIos) {
      runIos('dev', 'org.reactjs.native.example.newRNArcTest')
    }
  }
}
