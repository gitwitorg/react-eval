"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemporaryDirectory = exports.createTemporaryFileSystem = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const tmp_1 = __importDefault(require("tmp"));
function createTemporaryFileSystem(appDotJS, packageDotJSON) {
    // Create a temporary directory
    const reactAppDirObj = tmp_1.default.dirSync({ unsafeCleanup: true });
    const reactAppDir = reactAppDirObj.name;
    // Create the public and src directories
    const publicDir = path_1.default.join(reactAppDir, 'public');
    const srcDir = path_1.default.join(reactAppDir, 'src');
    fs_1.default.mkdirSync(publicDir);
    fs_1.default.mkdirSync(srcDir);
    const indexHtmlContent = `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com/"></script>
      <title>Document</title>
    </head>
    <body>
      <div id="root"></div>
    </body>
  </html>`;
    const indexJsContent = `import React, { StrictMode } from "react";
  import { createRoot } from "react-dom/client";
  
  import App from "./App";
  
  const root = createRoot(document.getElementById("root"));
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );`;
    const tailwindJSdotConfig = `tailwind.config = {
    theme: {
      extend: {
        colors: {
          clifford: '#da373d',
        }
      }
    },
  }`;
    // Write the contents to files
    fs_1.default.writeFileSync(path_1.default.join(srcDir, 'index.js'), indexJsContent);
    fs_1.default.writeFileSync(path_1.default.join(srcDir, 'tailwind-config.js'), tailwindJSdotConfig);
    fs_1.default.writeFileSync(path_1.default.join(reactAppDir, 'package.json'), packageDotJSON);
    fs_1.default.writeFileSync(path_1.default.join(publicDir, 'index.html'), indexHtmlContent);
    fs_1.default.writeFileSync(path_1.default.join(srcDir, 'App.js'), appDotJS);
    // REMOVE
    console.log(`\n\nContents of index.js: ${fs_1.default.readFileSync(path_1.default.join(srcDir, 'index.js'), 'utf-8')}`);
    console.log(`\nContents of App.js: ${fs_1.default.readFileSync(path_1.default.join(srcDir, 'App.js'), 'utf-8')}`);
    console.log(`\nContents of tailwind-config.js: ${fs_1.default.readFileSync(path_1.default.join(srcDir, 'tailwind-config.js'), 'utf-8')}`);
    console.log(`\nContents of package.json: ${fs_1.default.readFileSync(path_1.default.join(reactAppDir, 'package.json'), 'utf-8')}`);
    console.log(`\nContents of index.html: ${fs_1.default.readFileSync(path_1.default.join(publicDir, 'index.html'), 'utf-8')}`);
    return {
        reactAppDirObj: reactAppDirObj,
        reactAppDir: reactAppDir
    };
}
exports.createTemporaryFileSystem = createTemporaryFileSystem;
function deleteTemporaryDirectory(tmpDirObject) {
    tmpDirObject.removeCallback();
}
exports.deleteTemporaryDirectory = deleteTemporaryDirectory;
// Recursive function to print the file structure.
function listDirectoryStructure(dir, prefix = '') {
    const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(dir, entry.name);
        if (entry.isDirectory()) {
            console.log(prefix + 'DIR: ' + fullPath);
            listDirectoryStructure(fullPath, prefix + '  ');
        }
        else {
            console.log(prefix + 'FILE: ' + fullPath);
        }
    }
}
