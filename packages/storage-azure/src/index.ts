import { BlobServiceClient, BlockBlobClient, ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

import { Build, RemoteStorage, ProjectBuildInfo } from "@rn-buildhub/storage-interface";
import path from "path";
import process from "process";

export function getProjectRootDir() {
  // todo improve this
  return process.cwd();
}

const ENV_CONNECTION_STRING = "RNBH_AZURE_CONNECTION_STRING";
const ENV_ACCOUNT_KEY = "RNBH_AZURE_ACCOUNT_KEY";
const ENV_ACCOUNT_NAME = "RNBH_AZURE_ACCOUNT_NAME";
const ENV_CONTAINER = "RNBH_AZURE_CONTAINER";
const ENV_AZURE_URL = "RNBH_AZURE_URL";
const ENV_SAS_URL = "RNBH_AZURE_SAS_URL";
const ENV_AZURE_AD_AUTH = "RNBH_AZURE_AD_AUTH";

const getEnv = (key: string) => process.env[key];

function getBlockBlobClient(filename: string, options: AzureBlobRunnerOptions) {
  const connectionString = getEnv(ENV_CONNECTION_STRING) ?? options.connectionString;
  const accountKey = getEnv(ENV_ACCOUNT_KEY) ?? options.accountKey;
  const accountName = getEnv(ENV_ACCOUNT_NAME) ?? options.accountName;
  const container = getEnv(ENV_CONTAINER) ?? options.container;
  const sasUrl = getEnv(ENV_SAS_URL) ?? options.sasUrl;
  const adAuth = (getEnv(ENV_AZURE_AD_AUTH) ?? String(options.adAuth)) === "true";

  if (sasUrl) {
    return new ContainerClient(sasUrl).getBlockBlobClient(filename);
  }

  if (!container) {
    throw Error("Did not pass valid container. Supply the container either via env or config.");
  }

  if (connectionString) {
    return new BlockBlobClient(connectionString, container, filename);
  }

  if (accountName) {
    const defaultUrl = `https://${accountName}.blob.core.windows.net`;
    const basePath = getEnv(ENV_AZURE_URL) ?? options.azureUrl ?? defaultUrl;

    if (accountKey) {
      const fullUrl = `${basePath}/${container}/${filename}`;
      const credential = new StorageSharedKeyCredential(accountName, accountKey);
      return new BlockBlobClient(fullUrl, credential);
    } else if (adAuth) {
      return new BlobServiceClient(basePath, new DefaultAzureCredential())
        .getContainerClient(container)
        .getBlockBlobClient(filename);
    }
  }

  throw Error(`Did not pass valid credentials. Supply them either via env or config.json.`);
}

interface AzureBlobRunnerOptions {
  connectionString?: string;
  accountKey?: string;
  accountName?: string;
  container?: string;
  azureUrl?: string;
  sasUrl?: string;
  adAuth?: boolean;
}

class AzureStorage extends RemoteStorage {
  private blob: (filename: string) => BlockBlobClient;

  // todo validate config
  constructor(config: object) {
    super();
    require("dotenv").config({ path: path.join(getProjectRootDir(), ".env") });
    this.blob = (filename: string) => getBlockBlobClient(filename, config);
  }

  async upload(buildId: string, buffer: Buffer, fileName: string): Promise<string> {
    const buildpath = this.getBuildPath(buildId);
    await this.blob(`${buildpath}/${fileName}`).uploadData(buffer, {
      metadata:{
        createdAt: new Date().toISOString(),
      }
    });
    return `${buildpath}/${fileName}`;
  }

  async setLastBuild(buildId: string): Promise<void> {
    const fileContent = JSON.stringify({ lastBuild: buildId });
    await this.blob(`config.json`).uploadData(Buffer.from(fileContent, "utf-8"));
  }

  async getLastBuild(): Promise<string> {
    const fileContent = await this.blob(`config.json`).downloadToBuffer();
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
    await this.blob(`${buildpath}/info.json`).uploadData(Buffer.from(JSON.stringify(infoToSave), "utf-8"));
  }

  async getBuildInfo(buildId: string): Promise<ProjectBuildInfo> {
    const buildpath = this.getBuildPath(buildId);
    const fileContent = await this.blob(`${buildpath}/info.json`).downloadToBuffer();
    return JSON.parse(fileContent.toString());
  }

  download(path: string): Promise<Buffer> {
    return this.blob(path).downloadToBuffer();
  }
}

export default AzureStorage;
