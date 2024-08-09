import childProcess from 'child_process';
import axios from 'axios';
import path from 'path';
import { getProjectRootDir, sleep } from './utils';
import { getDefaultUserTerminal, startServerInNewWindow } from '@react-native-community/cli-tools';


import { execSync } from 'child_process';

function getTerminalPath(): string {
  try {
    if (process.platform === 'win32') {
      // Default to PowerShell on Windows
      let defaultTerminal = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

      try {
        // Attempt to identify if it's Command Prompt
        const parentProcessId = process.ppid;
        const query = `wmic process where (ProcessId=${parentProcessId}) get CommandLine`;
        const parentProcessCmdLine = execSync(query).toString();

        if (parentProcessCmdLine.includes('cmd.exe')) {
          defaultTerminal = 'C:\\Windows\\System32\\cmd.exe';
        }
      } catch (error) {
        console.warn('Could not determine specific terminal, defaulting to PowerShell.');
      }

      return defaultTerminal;
    } else {
      // Default to /bin/bash or /bin/sh on Unix-like systems
      let defaultTerminal = '/bin/bash';

      try {
        const ppid = process.ppid;
        const command = `ps -o comm= -p ${ppid}`;
        const terminalPath = execSync(command).toString().trim();

        if (terminalPath) {
          defaultTerminal = terminalPath;
        }
      } catch (error) {
        console.warn('Could not determine specific terminal, defaulting to /bin/bash.');
      }

      return defaultTerminal;
    }
  } catch (error) {
    console.error('Error obtaining terminal path:', error);
    return 'Error';
  }
}
export async function startMetro(resetCache = false, port = '8081') {
  try {
    console.log('getDefaultUserTerminal()', getTerminalPath());
    startServerInNewWindow(
      Number(port),
      getProjectRootDir(),
      path.join(getProjectRootDir(), 'node_modules/react-native'),
      getTerminalPath(),
    );
  }catch (e){
    console.error(e);
    throw e;
  }


  while (!(await checkIsMetroRunning(port))) {
    await sleep(100);
  }
}

export async function checkIsMetroRunning(port = '8081') {
  try {
    await axios.get(`http://localhost:${port}`);
    return true;
  } catch (ex) {
    if ((ex as any)?.message?.includes('ECONNREFUSED') || (ex as any)?.code?.includes('ECONNREFUSED')) {
      return false;
    }
    throw ex;
  }
}
