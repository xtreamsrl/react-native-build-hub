import {Storage, Bucket} from "@google-cloud/storage";

import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { Build, RemoteStorage, ProjectBuildInfo } from "@rn-buildhub/storage-interface";

export interface GCPStorageOptions {
  gcpBucket?: string;
  gcpApplicationCredentials?: string;
}

export function getProjectRootDir() {
  // todo improve this
  return process.cwd();
}

function getOptions(options: GCPStorageOptions) {
  return {
    gcpBucket: process.env.RNBH_GCP_BUCKET ?? options.gcpBucket,
    gcpApplicationCredentials: process.env.RNBH_GOOGLE_APPLICATION_CREDENTIALS ?? options.gcpApplicationCredentials,
  };
}


// todo rename hub adapter to stare and then create a hub that extends the storage?
class GCPStorage extends RemoteStorage {
  private bucket: Bucket;

  // todo validate config

  public constructor(fileOptions?: GCPStorageOptions) {
    super();
    require("dotenv").config({ path: path.join(getProjectRootDir(), ".env") });
    const options = getOptions(fileOptions || {});
    if(!options.gcpApplicationCredentials){
      throw new Error("Missing RNBH_GOOGLE_APPLICATION_CREDENTIALS env variable");
    }
    const jsonFileContent = fs.readFileSync(
      path.join(getProjectRootDir(), options.gcpApplicationCredentials),
      "utf8"
    );
    const credentials = JSON.parse(jsonFileContent.toString());
    console.log("credentials", credentials)
    console.log("options", options);
    const storage = new Storage({
      credentials
    })
    if (!options.gcpBucket) {
      throw new Error("Missing RNBH_GCP_BUCKET env variable");
    }

    this.bucket = storage.bucket(options.gcpBucket);
  }

  private async uploadFileToGcp(
    path: string,
    buffer: Buffer,
    metadata?: { [key: string]: string }
  ) {
    await this.bucket.file(path).save(buffer, {
      metadata: metadata
    });
  }

  async upload(buildId: string, buffer: Buffer, fileName: string): Promise<string> {
    const buildpath = this.getBuildPath(buildId);

    await this.uploadFileToGcp(`${buildpath}/${fileName}`, buffer, {
      createdAt: new Date().toISOString()
    });
    return `${buildpath}/${fileName}`;
  }

  async downloadFileFromGcp(path: string): Promise<Buffer> {
    const [buffer] = await this.bucket.file(path).download();
    return buffer;
  }

  async setLastBuild(buildId: string): Promise<void> {
    const fileContent = JSON.stringify({ lastBuild: buildId });
    await this.uploadFileToGcp(`config.json`, Buffer.from(fileContent, "utf-8"));
  }

  async getLastBuild(): Promise<string> {
    const fileContent = await this.downloadFileFromGcp(`config.json`);
    return JSON.parse(fileContent.toString()).lastBuild;
  }

  private getBuildPath(buildId: string) {
    return `builds/${buildId}`;
  }

  async saveBuildInfo(buildId: string, info: {
    androidBuilds: Build[];
    iosBuilds: Build[];
  }): Promise<void> {
    const buildpath = this.getBuildPath(buildId);
    const infoToSave: ProjectBuildInfo = {
      ...info,
      createdAt: new Date().toISOString(),
      version: 1,
      id: buildId
    };
    await this.uploadFileToGcp(`${buildpath}/info.json`, Buffer.from(JSON.stringify(infoToSave), "utf-8"));
  }

  async getBuildInfo(buildId: string): Promise<ProjectBuildInfo> {
    const buildpath = this.getBuildPath(buildId);
    const fileContent = await this.downloadFileFromGcp(`${buildpath}/info.json`);
    return JSON.parse(fileContent.toString());
  }

  download(path: string): Promise<Buffer> {
    return this.downloadFileFromGcp(path);
  }
}

export default GCPStorage;
