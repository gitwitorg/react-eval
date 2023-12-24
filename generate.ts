import * as fs from "fs";

import { config } from "dotenv";
config();

import { generateCode } from "gitwit-server";

const addDependencies = (
  packageDotJSON: string,
  dependencies: { [key: string]: string }
) => {
  const packageDotJSONData = JSON.parse(packageDotJSON);
  for (const dependency in dependencies) {
    if (packageDotJSONData.dependencies[dependency] === undefined) {
      packageDotJSONData.dependencies[dependency] = dependencies[dependency];
    }
  }
  return packageDotJSONData;
};

(async () => {
  const appDotJS = fs.readFileSync("./sandbox/app/src/App.js", "utf-8");
  const packageDotJSON = fs.readFileSync("./sandbox/app/package.json", "utf-8");
  const { code, dependencies } = await generateCode(appDotJS, "add a carousel");
  const newDependencies = addDependencies(packageDotJSON, dependencies);
  console.log(code);
  console.log(newDependencies);
})();
