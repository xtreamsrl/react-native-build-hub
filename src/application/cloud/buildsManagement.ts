import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import { setDoc, doc, collection, addDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { ref, getStorage, uploadBytes, uploadBytesResumable, StorageReference } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getRootDestinationFolder } from '../utils';
import logger from '../logger';

export type Build = {
  device: 'all' | 'iphoneSimulator';
  flavor: string;
  release: boolean;
  debug: boolean;
  type: 'release' | 'debug';
  path: string;
};

async function zipFolder(folderPath: string, outputZipPath: string) {
  const folderAbsolutePath = path.resolve(folderPath);

  if (!fs.existsSync(folderAbsolutePath)) {
    console.error(`The folder "${folderPath}" does not exist.`);
    return;
  }

  const output = fs.createWriteStream(outputZipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Compression level (0 to 9)
  });

  output.on('close', function () {
    console.log(`Folder "${folderPath}" zipped to "${outputZipPath}" successfully.`);
  });

  archive.on('error', function (err) {
    console.error('Error creating zip archive:', err);
  });

  archive.pipe(output);
  archive.directory(folderAbsolutePath, false);
  return archive.finalize();
}

async function upload(fileRef: StorageReference, buffer: Buffer) {
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(fileRef, buffer);

    uploadTask.on(
      'state_changed',
      snapshot => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        logger.debug('Upload is ' + progress + '% done');
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
  for (const buildInfo of [...androidBuilds, ...iosBuilds]) {
    const fileName = `${buildInfo.device}-${buildInfo.flavor}-${buildInfo.type}.zip`;
    const fileRef = ref(getStorage(), `${rootBuildsFolder}/${fileName}`);
    const tempZipPath = path.join(tempBuildsFolder, fileName);
    logger.debug(`Zipping ${buildInfo.path} to ${tempZipPath}`);
    await zipFolder(buildInfo.path, tempZipPath);
    logger.debug(`Uploading ${tempZipPath} to ${fileRef.fullPath}`);
    await upload(fileRef, fs.readFileSync(tempZipPath));
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

  fs.rmSync(tempBuildsFolder, { recursive: true });
}
