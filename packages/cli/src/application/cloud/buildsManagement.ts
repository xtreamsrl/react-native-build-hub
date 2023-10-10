import fs from "node:fs";
import path from "node:path";

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
  where
} from "firebase/firestore";
import { getBytes, getStorage, ref, StorageReference, uploadBytesResumable } from "firebase/storage";
import AdmZip from "adm-zip";
import { capitalize, getAdapter, getBuildFolderByBuildId, getRootDestinationFolder } from "../utils";
import logger from "../logger";
import { iosBuildPlatforms } from "../iosUtils";
import { ProjectConfiguration } from "./projectsManagement";
import { Build, HubAdapter } from "../../adapters/adapter";


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
    process.stdout.write("\n");

    uploadTask.on(
      "state_changed",
      snapshot => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        clearLastLine();
        logger.info(`Upload of ${filename} is ${progress.toFixed(0)}% done`);
        switch (snapshot.state) {
        case "paused":
          logger.debug("Upload is paused");
          break;
        case "running":
          logger.debug("Upload is running");
          break;
        }
      },
      error => {
        // Handle unsuccessful uploads
        reject(error);
      },
      () => {
        resolve(uploadTask.snapshot.ref);
      }
    );
  });
}

export async function uploadBuilds(androidBuilds: Build[], iosBuilds: Build[], config: ProjectConfiguration) {
  // for each build zip the folder and upload to firebase storage than create e build document in the builds collection
  /*
    create a build folder in firestore
    const buildRef = await addDoc(collection(getFirestore(), "builds"), {
      projectId: projectId,
      createdAt: serverTimestamp(),
      createdBy: getAuth().currentUser!.uid,
      version: "1.0.0" // todo,
      const buildId = buildRef.id;
    }); */
  const adapter = getAdapter(config);
  const buildId = adapter.createBuildId();
  const tempBuildsFolder = path.join(getRootDestinationFolder(), "temp_builds", buildId);
  fs.mkdirSync(tempBuildsFolder, { recursive: true });

  logger.info(`Found ${androidBuilds.length} android builds and ${iosBuilds.length} ios builds`);
  // todo improve parallelism
  for (const buildInfo of [...androidBuilds, ...iosBuilds]) {
    const fileName = `${buildInfo.device}-${buildInfo.flavor}-${buildInfo.type}.zip`;
    /*     const rootBuildsFolder = `projects/${projectId}/builds/${buildId}`;
    const fileRef = ref(getStorage(), `${rootBuildsFolder}/${fileName}`); */
    const tempZipPath = path.join(tempBuildsFolder, fileName);
    logger.debug(`Zipping ${buildInfo.path} to ${tempZipPath}`);
    await zipFolder(buildInfo.path, tempZipPath);
    logger.debug(`Uploading ${tempZipPath}`);
    const fullPath = await adapter.upload(buildId, new AdmZip(tempZipPath).toBuffer(), fileName);
    // await upload(fileRef, new AdmZip(tempZipPath).toBuffer(), fileName);
    logger.debug(`Uploaded ${tempZipPath}`);
    buildInfo.path = fullPath;
  }
  // await setDoc(
  //   buildRef,
  //   {
  //     androidBuilds: androidBuilds,
  //     iosBuilds: iosBuilds,
  //   },
  //   { merge: true },
  // );
  await adapter.setLastBuild(buildId);
  await adapter.saveBuildInfo(buildId, {
    androidBuilds: androidBuilds,
    iosBuilds: iosBuilds
  });
  logger.info(`Builds created successfully. Build id: ${buildId}`);

  fs.rmSync(tempBuildsFolder, { recursive: true });
  return buildId;
}

export async function getLastBuild(config: ProjectConfiguration): Promise<string> {
  // const lastBuild = await getDocs(
  //   query(
  //     collection(getFirestore(), 'builds'),
  //     where('projectId', '==', projectId),
  //     orderBy('createdAt', 'desc'),
  //     limit(1),
  //   ),
  // );
  // return { ...(lastBuild.docs[0].data() as ProjectBuildDoc), id: lastBuild.docs[0].id } as ProjectBuildDoc;
  const adapter = getAdapter(config);
  return adapter.getLastBuild();
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

async function downloadZipBuild(buildInfo: Build, buildId: string, adapter: HubAdapter) {
  // const fileRef = ref(getStorage(), buildInfo.path);
  const tempZipPath = path.join(getRootDestinationFolder(), "temp_builds", buildId, path.basename(buildInfo.path));
  logger.debug(`Downloading ${buildInfo.path} to ${tempZipPath}`);
  //const fileBuffer = await getBytes(fileRef);
  const buffer = await adapter.download(buildInfo.path);
  fs.mkdirSync(path.dirname(tempZipPath), { recursive: true });
  fs.writeFileSync(tempZipPath, buffer);
  logger.debug(`Downloaded ${buildInfo.path} to ${tempZipPath}`);
  return tempZipPath;
}

export async function downloadBuild(buildId: string, projectConfig: ProjectConfiguration): Promise<void> {
  // const buildInfoDoc = await getDoc(doc(getFirestore(), "builds", buildId));
  // const build = buildInfoDoc.data() as ProjectBuildDoc;
  const adapter = getAdapter(projectConfig);
  const build = await adapter.getBuildInfo(buildId);
  logger.info(`Found ${build.androidBuilds.length} android builds and ${build.iosBuilds.length} ios builds`);
  // todo improve parallelism
  for (const buildInfo of build.androidBuilds) {
    const tempZipPath = await downloadZipBuild(buildInfo, buildId, adapter);
    const destinationFolder = path.join(getBuildFolderByBuildId(buildId), "android", buildInfo.flavor, buildInfo.type);
    await unzipFile(tempZipPath, destinationFolder);
    fs.rmSync(tempZipPath);
  }
  for (const buildInfo of build.iosBuilds) {
    const tempZipPath = await downloadZipBuild(buildInfo, buildId, adapter);
    const destinationFolder = path.join(
      getRootDestinationFolder(),
      "builds",
      buildId,
      "ios",
      `${buildInfo.device}-${buildInfo.flavor}`,
      capitalize(buildInfo.type)
    );

    await unzipFile(tempZipPath, destinationFolder);
    fs.rmSync(tempZipPath);
  }
}

export async function makeCurrentBuild(buildId: string) {
  const androidPath = path.join(getRootDestinationFolder(), "android");
  if (fs.existsSync(androidPath)) {
    fs.rmSync(androidPath, { recursive: true });
  }
  const iosPath = path.join(getRootDestinationFolder(), "ios");
  if (fs.existsSync(iosPath)) {
    fs.rmSync(iosPath, { recursive: true });
  }
  fs.cpSync(getBuildFolderByBuildId(buildId), getRootDestinationFolder(), { recursive: true });
}

export function getAvailableCurrentBuilds() {
  const androidBuilds: Build[] = [];
  const androidFolder = path.join(getRootDestinationFolder(), "android");
  if (fs.existsSync(androidFolder)) {
    const flavorsFolders = fs.readdirSync(androidFolder);
    for (const flavorFolder of flavorsFolders) {
      const debugBuildPath = path.join(androidFolder, flavorFolder, "debug");
      if (fs.existsSync(debugBuildPath)) {
        androidBuilds.push({
          device: "all",
          flavor: flavorFolder,
          release: false,
          debug: true,
          type: "debug",
          path: debugBuildPath
        });
      }
    }
  }
  const iosBuilds: Build[] = [];
  const iosFolder = path.join(getRootDestinationFolder(), "ios");
  if (fs.existsSync(iosFolder)) {
    const flavorsFolders = fs.readdirSync(iosFolder);
    for (const flavorFolder of flavorsFolders) {
      const [deviceType, ...flavor] = flavorFolder.split("-");
      const debugBuildPath = path.join(iosFolder, flavorFolder, "Debug");
      if (fs.existsSync(debugBuildPath) && deviceType === iosBuildPlatforms.simulator.name) {
        iosBuilds.push({
          device: "iphonesimulator",
          flavor: flavor.join("-"),
          release: false,
          debug: true,
          type: "debug",
          path: debugBuildPath
        });
      }
    }
  }
  return { androidBuilds, iosBuilds };
}
