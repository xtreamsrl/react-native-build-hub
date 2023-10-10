import fs from 'node:fs';
import path from 'node:path';
import { getDoc, doc, collection, addDoc, getFirestore, serverTimestamp, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getRootDestinationFolder } from '../utils';
import logger from '../logger';

export type ProjectFileSchema = {
  name: string;
  id: string;
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

export async function checkProject(): Promise<ProjectFileSchema> {
  if (!fs.existsSync(path.join(getRootDestinationFolder(), 'project.json'))) {
    throw new Error('No project found. Please select or create a project first');
  } else {
    const projectData = JSON.parse(fs.readFileSync(path.join(getRootDestinationFolder(), 'project.json'), 'utf-8'));
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
