import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import { packageDotJSONFromAppDotJS } from "./gitwit";

interface TmpDirObject {
  name: string;
  removeCallback: () => void;
}

export function createTemporaryFileSystem(): Record<string, any> {
  // Create a temporary directory
  const reactAppDirObj = tmp.dirSync({ unsafeCleanup: true });
  const reactAppDir: string = reactAppDirObj.name;
  fs.cpSync(path.join(__dirname, '../../app'), reactAppDir, { recursive: true });
  fs.writeFileSync(path.join(reactAppDir, 'package.json'), packageDotJSONFromAppDotJS(fs.readFileSync(path.join(reactAppDir, 'src', 'App.js'), 'utf8')));

  return {
    reactAppDirObj: reactAppDirObj,
    reactAppDir: reactAppDir
  }
}

export function deleteTemporaryDirectory(tmpDirObject: TmpDirObject): void {
  tmpDirObject.removeCallback();
}