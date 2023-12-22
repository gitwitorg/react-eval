import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

interface TmpDirObject {
  name: string;
  removeCallback: () => void;
}

export function createTemporaryFileSystem(appDotJS: string, packageDotJSON: string): Record<string, any> {
  // Create a temporary directory
  const reactAppDirObj = tmp.dirSync({ unsafeCleanup: true });
  const reactAppDir: string = reactAppDirObj.name;
  // Create the public and src directories
  const publicDir = path.join(reactAppDir, 'public');
  const srcDir = path.join(reactAppDir, 'src');

  fs.mkdirSync(publicDir);
  fs.mkdirSync(srcDir);
  const indexHtmlContent = fs.readFileSync('./app/public/index.html', 'utf8');
  const indexJsContent = fs.readFileSync('./app/src/index.js', 'utf8');
  const tailwindJSdotConfig = fs.readFileSync('./app/src/tailwind-config.js', 'utf8');

  // Write the contents to files
  fs.writeFileSync(path.join(srcDir, 'index.js'), indexJsContent);
  fs.writeFileSync(path.join(srcDir, 'tailwind-config.js'), tailwindJSdotConfig);
  fs.writeFileSync(path.join(reactAppDir, 'package.json'), packageDotJSON);
  fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtmlContent);
  fs.writeFileSync(path.join(srcDir, 'App.js'), appDotJS);

  return {
    reactAppDirObj: reactAppDirObj,
    reactAppDir: reactAppDir
  }
}

export function deleteTemporaryDirectory(tmpDirObject: TmpDirObject): void {
  tmpDirObject.removeCallback();
}