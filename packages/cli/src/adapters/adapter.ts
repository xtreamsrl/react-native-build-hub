// create a random build id (alfanumeric string)
function createBuildId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export type Build = {
  device: "all" | "iphonesimulator";
  flavor: string;
  release: boolean;
  debug: boolean;
  type: "release" | "debug";
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

export abstract class HubAdapter {
  createBuildId(): string {
    return createBuildId();
  }

  abstract setLastBuild(buildId: string): Promise<void> ;

  abstract getLastBuild(): Promise<string>;

  abstract saveBuildInfo(buildId: string, info: {
    androidBuilds: Build[];
    iosBuilds: Build[];
  }): Promise<void>;


  abstract getBuildInfo(buildId: string): Promise<{
    androidBuilds: Build[];
    iosBuilds: Build[];
  }>;

  abstract upload(buildId: string, buffer: Buffer, fileName: string): Promise<string>;
  abstract download(path: string): Promise<Buffer>;
}
