import { Command, Flags } from "@oclif/core";
import fs from "fs";
import { getConfigFile, getProjectRootDir, getRootDestinationFolderBaseName } from "../application/utils";
import logger from "../application/logger";
import { ProjectConfiguration } from "../application/cloud/projectsManagement";
import path from "path";

const remoteMapping = {
  azure: "@rn-buildhub/azure-storage",
  aws: "@rn-buildhub/s3-storage",
  gcp: "@rn-buildhub/gcp-storage"
};


function addDevDepsToPackageJson(deps: Record<string, string>) {
  const packageJsonPath = path.join(getProjectRootDir(), "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    packageJson.devDependencies = {
      ...(packageJson.devDependencies || {}),
      ...deps
    };
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

}

export default class Init extends Command {
  static description = "Create native builds for android and ios";

  static examples = [
    "<%= config.bin %> <%= command.id %> -i -f=dev",
    "<%= config.bin %> <%= command.id %> -a -f=prod",
    "<%= config.bin %> <%= command.id %> -a -f=prod --release",
    "<%= config.bin %> <%= command.id %> -a --release",
    "<%= config.bin %> <%= command.id %> -a --incremental"
  ];

  static flags = {
    remote: Flags.string({
      char: "r", description: "The remote storage to use",
      options: ["azure", "aws", "gcp"]
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Init);
    // check if already initialized by checking if .rn-buildhub.json exists
    if (fs.existsSync(getConfigFile())) {
      this.error("Already initialized");
    }
    let remote = flags.remote;
    if (!remote) {
      const { default: inquirer } = await import("inquirer");
      let responses: any = await inquirer.prompt([{
        name: "remote",
        message: "select a remote storage to use",
        type: "list",
        choices: [{ name: "azure" }, { name: "aws" }, { name: "gcp" }]
      }]);
      remote = responses.remote;
    }
    if (remote && remote in remoteMapping) {
      const remotePackage = remoteMapping[remote as keyof typeof remoteMapping];
      logger.info(`Updating package.json with ${remotePackage} and @rn-buildhub/cli`);
      logger.info(`Please install ${remotePackage} with your package manager`);

      const version =  this.config.version;

      addDevDepsToPackageJson({
        '@rn-buildhub/cli': `^${version}`,
        [remotePackage]: `^${version}`
      });
      // create the config file and write it
      const config: ProjectConfiguration = {
        remote: {
          name: remotePackage,
          config: {}
        }
      };
      logger.info(`Creating configuration file ${getConfigFile()}`);
      fs.writeFileSync(getConfigFile(), JSON.stringify(config, null, 2));
    }
    // append to gitignore .rn-buildhub if gitignore exists
    if (fs.existsSync(".gitignore")) {
      logger.info(`Adding build cache folder to .gitignore`);
      fs.appendFileSync(".gitignore", `${getRootDestinationFolderBaseName()}`);
    }

    this.exit(0);
  }
}
