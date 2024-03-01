import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

import { config } from "dotenv";
config();

import evalConfig from "./config.json";

import { generateCode } from "gitwit-server";

import { EvalItem, GenerationResult } from "./types";
import { asyncMap } from "./utils";

const appDotJS = fs.readFileSync("./sandbox/app/src/App.js", "utf-8");
const packageDotJSON = fs.readFileSync("./sandbox/app/package.json", "utf-8");

const runsPath = "./runs"
const evalsPath = "./evals"

// Add dependencies to package.json
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

function repeatArray(arr: any[], n: number): any[] {
  return Array.from({ length: n }, () => [...arr]).flat();
}

// Generate code for each prompt
async function runGenerations(dataset: string) {

  // Create the runs directory if it doesn't exist
  if (!fs.existsSync(runsPath)) {
    fs.mkdirSync(runsPath);
  }
  
  // Create new directory for this run
  const maxNumber = fs
    .readdirSync(runsPath)
    .filter((dir) => !isNaN(parseInt(dir)))
    .reduce((max, dir) => Math.max(max, parseInt(dir)), 0);
  const newNumber = maxNumber + 1;
  const newDir = path.join(runsPath, newNumber.toString());

  // Read the evals file
  const filePath = path.join(evalsPath, `${dataset}.json`);
  const data = fs.readFileSync(filePath, "utf8");
  const items: EvalItem[] = repeatArray(JSON.parse(data), evalConfig.n_generations || 1);

  // Confirm with the user
  console.log(`Press return to start ${items.length} generations.`);
  const stdin = process.openStdin();
  await new Promise((resolve) => stdin.once("data", resolve));
  console.log("Generating...")

  // Generate code for each prompt
  fs.mkdirSync(newDir, { recursive: true });
  console.log(`Generated code will be saved in ${newDir}`);

  const processedItems: GenerationResult[] = [];
  await asyncMap(items, evalConfig.max_concurrent_generations || 1, async (item : EvalItem) => {
    const { code: newAppDotJS, dependencies } = await generateCode(
      appDotJS,
      item.prompt
    );
    const newPackageDotJSON = JSON.stringify(
      addDependencies(packageDotJSON, dependencies),
      null,
      2
    );
    processedItems.push({
      id: uuidv4(),
      prompt: item.prompt,
      appDotJS: newAppDotJS,
      packageDotJSON: newPackageDotJSON,
      created: new Date().toISOString(),
    });
    fs.writeFileSync(
      path.join(newDir, `generations.json`),
      JSON.stringify(processedItems, null, 2)
    );
    console.log(
      `Generated (${processedItems.length}/${items.length}) ${item.prompt}`
    );
  });

  console.log(`Ran ${processedItems.length} generations in ${newDir}`);
  console.log(`To evaluate, run: yarn evaluate ${newNumber}`);

  process.exit(0);
}

const dataset = process.argv[2];
if (!dataset) {
  console.error("No argument provided. Usage: yarn generate <dataset>");
  process.exit(1);
}

runGenerations(dataset);