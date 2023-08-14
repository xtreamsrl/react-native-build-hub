import fs from 'node:fs';
import path from 'node:path';
import { doc, collection, addDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getRootDestinationFolder } from '../utils';
import logger from '../logger';

export async function createProject(name: string): Promise<string> {
  const docRef = await addDoc(collection(getFirestore(), 'projects'), {
    name: name,
    createdAt: serverTimestamp(),
    createdBy: getAuth().currentUser!.uid,
  });
  logger.info('Project created with ID: ', docRef.id);

  return docRef.id;
}

export async function saveProjectData(name: string, id: string) {
  fs.writeFileSync(path.join(getRootDestinationFolder(), 'project.json'), JSON.stringify({ name, id }));
}

export async function checkProject(): Promise<ProjectData> {
  if (!fs.existsSync(path.join(getRootDestinationFolder(), 'project.json'))) {
    throw new Error('No project found. Please select or create a project first');
  } else {
    const projectData = JSON.parse(fs.readFileSync(path.join(getRootDestinationFolder(), 'project.json'), 'utf-8'));
    return projectData;
  }
}

export type ProjectData = {
  name: string;
  id: string;
};
