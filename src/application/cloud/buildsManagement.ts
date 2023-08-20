import fs from 'node:fs';
import path from 'node:path';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { getBytes, getStorage, ref, StorageReference, uploadBytesResumable } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import AdmZip from 'adm-zip';
import { capitalize, getBuildFolderByBuildId, getRootDestinationFolder } from '../utils';
import logger from '../logger';
import { iosBuildPlatforms } from '../iosUtils';

export type Build = {
  device: 'all' | 'iphonesimulator';
  flavor: string;
  release: boolean;
  debug: boolean;
  type: 'release' | 'debug';
  path: string;
};

export type ProjectBuildDoc = {
  id: string;
  projectId: string;
  androidBuilds: Build[];
  iosBuilds: Build[];
  createdAt: string;
  createdBy: string;
  version: string;
};

async function zipFolder(folderPath: string, outputZipPath: string) {
  if (!fs.existsSync(folderPath)) {
    console.error(`The folder "${folderPath}" does not exist.`);
    return;
  }
  const newZip = new AdmZip();
  newZip.addLocalFolder(folderPath);
  return newZip.writeZipPromise(outputZipPath);
}

function clearLastLine() {
  process.stdout.moveCursor(0, -1); // up one line
  process.stdout.clearLine(1); // from cursor to end
}

async function upload(fileRef: StorageReference, buffer: Buffer, filename: string) {
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, buffer);
    process.stdout.write('\n');

    uploadTask.on(
      'state_changed',
      snapshot => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        clearLastLine();
        logger.info(`Upload of ${filename} is ${progress.toFixed(0)}% done`);
        switch (snapshot.state) {
          case 'paused':
            logger.debug('Upload is paused');
            break;
          case 'running':
            logger.debug('Upload is running');
            break;
        }
      },
      error => {
        // Handle unsuccessful uploads
        reject(error);
      },
      () => {
        resolve(uploadTask.snapshot.ref);
      },
    );
  });
}

export async function uploadBuilds(androidBuilds: Build[], iosBuilds: Build[], projectId: string) {
  // for each build zip the folder and upload to firebase storage than create e build document in the builds collection
  const buildRef = await addDoc(collection(getFirestore(), 'builds'), {
    projectId: projectId,
    createdAt: serverTimestamp(),
    createdBy: getAuth().currentUser!.uid,
    version: '1.0.0', // todo,
  });
  const buildId = buildRef.id;
  const tempBuildsFolder = path.join(getRootDestinationFolder(), 'temp_builds', buildId);
  fs.mkdirSync(tempBuildsFolder, { recursive: true });
  const rootBuildsFolder = `projects/${projectId}/builds/${buildId}`;
  logger.info(`Found ${androidBuilds.length} android builds and ${iosBuilds.length} ios builds`);
  // todo improve parallelism
  for (const buildInfo of [...androidBuilds, ...iosBuilds]) {
    const fileName = `${buildInfo.device}-${buildInfo.flavor}-${buildInfo.type}.zip`;
    const fileRef = ref(getStorage(), `${rootBuildsFolder}/${fileName}`);
    const tempZipPath = path.join(tempBuildsFolder, fileName);
    logger.debug(`Zipping ${buildInfo.path} to ${tempZipPath}`);
    await zipFolder(buildInfo.path, tempZipPath);
    logger.debug(`Uploading ${tempZipPath} to ${fileRef.fullPath}`);
    await upload(fileRef, new AdmZip(tempZipPath).toBuffer(), fileName);
    logger.debug(`Uploaded ${tempZipPath} to ${fileRef.fullPath}`);
    buildInfo.path = fileRef.fullPath;
  }
  await setDoc(
    buildRef,
    {
      androidBuilds: androidBuilds,
      iosBuilds: iosBuilds,
    },
    { merge: true },
  );
  logger.info(`Builds created successfully. Build id: ${buildId}`);

  fs.rmSync(tempBuildsFolder, { recursive: true });
  return buildId;
}

export async function getLastBuild(projectId: string): Promise<ProjectBuildDoc> {
  const lastBuild = await getDocs(
    query(
      collection(getFirestore(), 'builds'),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(1),
    ),
  );
  return { ...(lastBuild.docs[0].data() as ProjectBuildDoc), id: lastBuild.docs[0].id } as ProjectBuildDoc;
}

function unzipFile(zipFilePath: string, destinationFolder: string): void {
  const zip = new AdmZip(zipFilePath);

  // Ensure the destination folder exists
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }

  zip.extractAllTo(destinationFolder, true);

  console.log(`File extracted to ${destinationFolder}`);
}

async function downloadZipBuild(buildInfo: Build, buildId: string) {
  const fileRef = ref(getStorage(), buildInfo.path);
  const tempZipPath = path.join(getRootDestinationFolder(), 'temp_builds', buildId, path.basename(buildInfo.path));
  logger.debug(`Downloading ${fileRef.fullPath} to ${tempZipPath}`);
  const fileBuffer = await getBytes(fileRef);
  fs.mkdirSync(path.dirname(tempZipPath), { recursive: true });
  fs.writeFileSync(tempZipPath, Buffer.from(fileBuffer));
  logger.debug(`Downloaded ${fileRef.fullPath} to ${tempZipPath}`);
  return tempZipPath;
}

export async function downloadBuild(buildId: string): Promise<void> {
  const buildInfoDoc = await getDoc(doc(getFirestore(), 'builds', buildId));
  const build = buildInfoDoc.data() as ProjectBuildDoc;
  logger.info(`Found ${build.androidBuilds.length} android builds and ${build.iosBuilds.length} ios builds`);
  // todo improve parallelism
  for (const buildInfo of build.androidBuilds) {
    const tempZipPath = await downloadZipBuild(buildInfo, buildId);
    const destinationFolder = path.join(getBuildFolderByBuildId(buildId), 'android', buildInfo.flavor, buildInfo.type);
    await unzipFile(tempZipPath, destinationFolder);
    fs.rmSync(tempZipPath);
  }
  for (const buildInfo of build.iosBuilds) {
    const tempZipPath = await downloadZipBuild(buildInfo, buildId);
    const destinationFolder = path.join(
      getRootDestinationFolder(),
      'builds',
      buildId,
      'ios',
      `${buildInfo.device}-${buildInfo.flavor}`,
      capitalize(buildInfo.type),
    );

    await unzipFile(tempZipPath, destinationFolder);
    fs.rmSync(tempZipPath);
  }
}

export async function makeCurrentBuild(buildId: string) {
  const androidPath = path.join(getRootDestinationFolder(), 'android');
  if (fs.existsSync(androidPath)) {
    fs.rmSync(androidPath, { recursive: true });
  }
  const iosPath = path.join(getRootDestinationFolder(), 'ios');
  if (fs.existsSync(iosPath)) {
    fs.rmSync(iosPath, { recursive: true });
  }
  fs.cpSync(getBuildFolderByBuildId(buildId), getRootDestinationFolder(), { recursive: true });
}

export function getAvailableCurrentBuilds() {
  const androidBuilds: Build[] = [];
  const androidFolder = path.join(getRootDestinationFolder(), 'android');
  if (fs.existsSync(androidFolder)) {
    const flavorsFolders = fs.readdirSync(androidFolder);
    for (const flavorFolder of flavorsFolders) {
      const debugBuildPath = path.join(androidFolder, flavorFolder, 'debug');
      if (fs.existsSync(debugBuildPath)) {
        androidBuilds.push({
          device: 'all',
          flavor: flavorFolder,
          release: false,
          debug: true,
          type: 'debug',
          path: debugBuildPath,
        });
      }
    }
  }
  const iosBuilds: Build[] = [];
  const iosFolder = path.join(getRootDestinationFolder(), 'ios');
  if (fs.existsSync(iosFolder)) {
    const flavorsFolders = fs.readdirSync(iosFolder);
    for (const flavorFolder of flavorsFolders) {
      const [deviceType, ...flavor] = flavorFolder.split('-');
      const debugBuildPath = path.join(iosFolder, flavorFolder, 'Debug');
      if (fs.existsSync(debugBuildPath) && deviceType === iosBuildPlatforms.simulator.name) {
        iosBuilds.push({
          device: 'iphonesimulator',
          flavor: flavor.join('-'),
          release: false,
          debug: true,
          type: 'debug',
          path: debugBuildPath,
        });
      }
    }
  }
  return { androidBuilds, iosBuilds };
}
