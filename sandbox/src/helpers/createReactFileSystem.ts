import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

interface TmpDirObject {
  name: string;
  removeCallback: () => void;
}

export function createTemporaryFileSystem(): Record<string, any> {
  // Create a temporary directory
  const reactAppDirObj = tmp.dirSync({ unsafeCleanup: true });
  const reactAppDir: string = reactAppDirObj.name;
  fs.cpSync(path.join(__dirname, '../../app'), reactAppDir, { recursive: true });

  return {
    reactAppDirObj: reactAppDirObj,
    reactAppDir: reactAppDir
  }
}

export function deleteTemporaryDirectory(tmpDirObject: TmpDirObject): void {
  tmpDirObject.removeCallback();
}