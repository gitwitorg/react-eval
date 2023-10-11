import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

// Create a temporary directory
export const reactAppDirObj = tmp.dirSync({ unsafeCleanup: true });
export const reactAppDir: string = reactAppDirObj.name;
// Create the public and src directories
const publicDir = path.join(reactAppDir, 'public');
const srcDir = path.join(reactAppDir, 'src');

fs.mkdirSync(publicDir);
fs.mkdirSync(srcDir);


const indexHtmlContent: string = `<!DOCTYPE html>
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
const appJsContent: string = `import React, { useEffect } from 'react';
import './tailwind-config.js';
import particlesJS from 'particles.js';

export default function App() {
  useEffect(() => {
    particlesJS.load('particles-js', './particles.json', function () {
      console.log('callback - particles.js config loaded');
    });
  }, []);

  return (
    <div className="p-2">
      <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
        My React App
      </h1>
      <div id="particles-js"></div>
    </div>
  );
}`;
const indexJsContent: string = `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`;
const tailwindConfigJsContent: string = `tailwind.config = {
    theme: {
      extend: {
        colors: {
          clifford: '#da373d',
        }
      }
    },
  }`;
const packageJson: string = `{
    "dependencies": {
      "particles.js": "*",
      "react": "^18.0.0",
      "react-dom": "^18.0.0",
      "react-scripts": "^4.0.0"
    },
    "scripts": {
      "start": "react-scripts --openssl-legacy-provider start"
    },
    "main": "./src/index.js",
    "browserslist": {
      "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      "development": [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    }
  }`

// Write the contents to files
fs.writeFileSync(path.join(publicDir, 'index.html'), indexHtmlContent);
fs.writeFileSync(path.join(srcDir, 'App.js'), appJsContent);
fs.writeFileSync(path.join(srcDir, 'index.js'), indexJsContent);
fs.writeFileSync(path.join(srcDir, 'tailwind-config.js'), tailwindConfigJsContent);
fs.writeFileSync(path.join(reactAppDir, 'package.json'), packageJson);


interface TmpDirObject {
  name: string;
  removeCallback: () => void;
}

export function deleteTemporaryDirectory(tmpDirObject: TmpDirObject): void {
  tmpDirObject.removeCallback();
}


// Recursive function to print of file structure.
function listDirectoryStructure(dir: string, prefix = ''): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      console.log(prefix + 'DIR: ' + fullPath);
      listDirectoryStructure(fullPath, prefix + '  ');
    } else {
      console.log(prefix + 'FILE: ' + fullPath);
    }
  }
}
// Call the function for the main temp directory
// listDirectoryStructure(reactAppDir);

// // List of files to check
// const files = ['index.html', 'App.js', 'index.js', 'tailwind-config.js', 'package.json'];

// // Loop through each file and log its content
// files.forEach((file) => {
//     const filePath = path.join(reactAppDir, file);
//     const content = fs.readFileSync(filePath, 'utf-8');
//     console.log(`\nContents of ${file}:\n`, content);
// });