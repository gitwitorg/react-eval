import * as ejs from "ejs";
import * as fs from "fs";
import * as path from "path";
import { exec } from 'child_process';

import { config } from "dotenv";
config();

import { EvalResult } from "./types";

const runsPath = "./runs"
const viewsPath = "./views"

function arrayToDict(arr: any[], groupingKey: string): { [key: string]: any[] } {
  const dict: { [key: string]: any[] } = {};
  for (const item of arr) {
    const key = item[groupingKey];
    if (dict[key]) {
      dict[key].push(item);
    } else {
      dict[key] = [item];
    }
  }
  return dict;
}

async function viewResults(runNumber: string) {
  // Read the generations file
  const results = JSON.parse(
    fs.readFileSync(path.join(runsPath, runNumber, "evaluations.json"), "utf8")
  ).map((result: EvalResult) => ({
    ...result,
    dependencies: JSON.parse(result.packageDotJSON).dependencies,
    screenshot: fs.existsSync(path.join(runsPath, runNumber, "screenshots", `${result.id}.png`)),
    log: fs.readFileSync(path.join(runsPath, runNumber, "logs", `${result.id}.log`), "utf8"),
    score: result.exitCode === 0 && result.errors?.length === 0
  }));
  const groups = arrayToDict(results, "prompt");

  const renderedHTML = ejs.render(
    fs.readFileSync(path.join(viewsPath, "index.ejs"), "utf-8"),
    { groups, results }
  );

  const outputPath = path.join(runsPath, runNumber, "index.html");
  fs.writeFileSync(outputPath, renderedHTML);
  console.log(`Wrote results to ${outputPath}.`);
  exec(`open ${outputPath}`);
}

const runNumber = process.argv[2];
if (!runNumber) {
  console.error("No run number provided. Usage: yarn evaluate <run>");
  process.exit(1);
}

viewResults(runNumber);
