import fs from 'node:fs';
import path from 'node:path';

import { getConfigFile, getRootDestinationFolder } from '../utils';


export type RemoteConfig = {
  name: string;
  config: object;
};

export type ProjectConfiguration = {
  remote: RemoteConfig;
  // this should not stay at project level because it indicates the build that the user has locally
  currentBuildId?: string | null;
};


export async function updateCurrentBuildInFile(buildId: string | null) {
  const projectData = await checkProject();
  projectData.currentBuildId = buildId;
  fs.writeFileSync(path.join(getRootDestinationFolder(), 'project.json'), JSON.stringify(projectData, null, 2));
}

export async function checkProject(): Promise<ProjectConfiguration> {
  if (!fs.existsSync(getConfigFile())) {
    throw new Error('No project found. Please select or create a project first');
  } else {
    // todo validate with zod or similar
    const projectData = JSON.parse(fs.readFileSync(getConfigFile(), 'utf-8'));
    return projectData;
  }
}
