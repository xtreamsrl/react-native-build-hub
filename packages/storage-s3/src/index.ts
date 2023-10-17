import { Readable } from "node:stream";
import * as clientS3 from "@aws-sdk/client-s3";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

export interface AwsRemoteOptions {
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsProfile?: string;
  awsEndpoint?: string;
  awsRegion?: string;
  awsBucket?: string;
  awsForcePathStyle?: boolean;
}

import { Build, RemoteStorage, ProjectBuildInfo } from "@rn-buildhub/storage-interface";

import process from "process";
import path from "path";

export function getProjectRootDir() {
  // todo improve this
  return process.cwd();
}

function getOptions(options: AwsRemoteOptions) {
  return {
    awsAccessKeyId: process.env.RNBH_AWS_ACCESS_KEY_ID ?? options.awsAccessKeyId,
    awsSecretAccessKey: process.env.RNBH_AWS_SECRET_ACCESS_KEY ?? options.awsSecretAccessKey,
    awsProfile: process.env.RNBH_AWS_PROFILE ?? options.awsProfile,
    awsEndpoint: process.env.RNBH_AWS_ENDPOINT ?? options.awsEndpoint,
    awsRegion: process.env.RNBH_AWS_REGION ?? options.awsRegion,
    awsBucket: process.env.RNBH_AWS_BUCKET ?? options.awsBucket,
    awsForcePathStyle: process.env.RNBH_AWS_FORCE_PATH_STYLE
      ? process.env.RNBH_AWS_FORCE_PATH_STYLE === "true"
      : options.awsForcePathStyle
  };
}

async function readableStreamToBuffer(readableStream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    readableStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", reject);
  });
}

// todo rename hub adapter to stare and then create a hub that extends the storage?
class S3Storage extends RemoteStorage {
  private bucket: string;
  private s3: clientS3.S3Client;

  // todo validate config

  public constructor(fileOptions?: AwsRemoteOptions) {
    super();
    require("dotenv").config({ path: path.join(getProjectRootDir(), ".env") });
    const options = getOptions(fileOptions || {});
    const awsBucket = options.awsBucket ?? "";
    const bucketTokens = awsBucket.split("/");
    this.bucket = bucketTokens.shift() as string;

    const clientConfig: clientS3.S3ClientConfig = {};

    if (options.awsRegion) {
      clientConfig.region = options.awsRegion;
    }

    if (options.awsEndpoint) {
      clientConfig.endpoint = options.awsEndpoint;
    }

    if (options.awsAccessKeyId && options.awsSecretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: options.awsAccessKeyId,
        secretAccessKey: options.awsSecretAccessKey
      };
    } else {
      clientConfig.credentials = fromNodeProviderChain(
        options.awsProfile ? { profile: options.awsProfile } : {}
      );
    }

    if (options.awsForcePathStyle) {
      clientConfig.forcePathStyle = true;
    }

    this.s3 = new clientS3.S3Client(clientConfig);
  }

  private async uploadFileToS3(
    path: string,
    buffer: Buffer,
    metadata?: { [key: string]: string }
  ) {
    // create command
    const command = new clientS3.PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: buffer,
      Metadata: metadata
    });
    await this.s3.send(command);
  }

  async upload(buildId: string, buffer: Buffer, fileName: string): Promise<string> {
    const buildpath = this.getBuildPath(buildId);

    await this.uploadFileToS3(`${buildpath}/${fileName}`, buffer, {
      createdAt: new Date().toISOString()
    });
    return `${buildpath}/${fileName}`;
  }

  async downloadFileFromS3(path: string): Promise<Buffer> {
    const command = new clientS3.GetObjectCommand({
      Bucket: this.bucket,
      Key: path
    });
    const res = await this.s3.send(command);
    const buffer = await readableStreamToBuffer(res.Body as Readable);
    return buffer;
  }

  async setLastBuild(buildId: string): Promise<void> {
    const fileContent = JSON.stringify({ lastBuild: buildId });
    await this.uploadFileToS3(`config.json`, Buffer.from(fileContent, "utf-8"));
  }

  async getLastBuild(): Promise<string> {
    const fileContent = await this.downloadFileFromS3(`config.json`);
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
    await this.uploadFileToS3(`${buildpath}/info.json`, Buffer.from(JSON.stringify(infoToSave), "utf-8"));
  }

  async getBuildInfo(buildId: string): Promise<ProjectBuildInfo> {
    const buildpath = this.getBuildPath(buildId);
    let fileContent: string = "";
    try {
      fileContent = (await this.downloadFileFromS3(`${buildpath}/info.json`)).toString();
    }catch (e) {
      throw new Error(`Build ${buildId} not found`);
    }
    return JSON.parse(fileContent.toString());
  }

  download(path: string): Promise<Buffer> {
    return this.downloadFileFromS3(path);
  }
}

export default S3Storage;
