import childProcess from 'child_process';
import axios from 'axios';
import path from 'path';
import { getProjectRootDir, sleep } from './utils';
import { getDefaultUserTerminal, startServerInNewWindow } from '@react-native-community/cli-tools';

export async function startMetro(resetCache = false, port = '8081') {
  startServerInNewWindow(
    Number(port),
    getDefaultUserTerminal()!,
    path.join(getProjectRootDir(), 'node_modules/react-native'),
  );

  while (!(await checkIsMetroRunning(port))) {
    await sleep(100);
  }
}

export async function checkIsMetroRunning(port = '8081') {
  try {
    await axios.get(`http://localhost:${port}`);
    return true;
  } catch (ex) {
    if ((ex as any)?.message.includes('ECONNREFUSED')) {
      return false;
    }
    throw ex;
  }
}
