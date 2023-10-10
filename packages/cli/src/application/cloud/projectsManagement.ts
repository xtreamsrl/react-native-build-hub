import fs from 'node:fs';
import path from 'node:path';
import { getDoc, doc, collection, addDoc, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getConfigFile, getRootDestinationFolder } from '../utils';
import logger from '../logger';

export type ProjectFileSchema = {
  name: string;
  id: string;
  currentBuildId: string | null;
};

type RemoteAdapterName = 'azure' | (string & {});

export type RemoteAdapterConfig = {
  name: RemoteAdapterName;
  config: object;
};

export type ProjectConfiguration = {
  remoteAdapter: RemoteAdapterConfig;
  // this should not stay at project level because it indicates the build that the user has locally
  currentBuildId: string | null;
};

export async function createProject(name: string): Promise<string> {
  const db = getFirestore();
  const batch = writeBatch(db);
  const projectRef = doc(collection(db, 'projects'));
  batch.set(projectRef, {
    name: name,
    createdAt: serverTimestamp(),
    createdBy: getAuth().currentUser!.uid,
  });

  batch.set(doc(collection(db, `users${getAuth().currentUser!.uid}`)), {
    projects: [{ id: projectRef.id, role: 'owner', name: name }],
  });

  logger.info(`Project created with ID: ${projectRef.id}`);
  await batch.commit();

  return projectRef.id;
}

export async function saveProjectData(name: string, id: string) {
  const projectData: ProjectFileSchema = { name, id, currentBuildId: null };
  fs.writeFileSync(path.join(getRootDestinationFolder(), 'project.json'), JSON.stringify(projectData, null, 2));
}

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

export async function getAvailableProjects(): Promise<ProjectData[]> {
  const user = await getDoc(doc(getFirestore(), 'users', getAuth().currentUser!.uid));
  return user.data()?.projects ?? [];
}

export type ProjectData = {
  name: string;
  id: string;
  role?: 'owner';
};
