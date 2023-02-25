import process from "process";
import fs from "fs";
import path from "path";



export function getRootDestinationFolder() {
  return path.join(getProjectRootDir(), 'app_builds');
}
export function getProjectRootDir() {
  return process.cwd();
}
export function getAppName() {

  const projectRootDir = getProjectRootDir();

  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRootDir, "package.json"), "utf8"));
// todo default app name improve passing from command line
  return packageJson.name;
}
