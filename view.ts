import * as ejs from "ejs";
import * as fs from "fs";
import * as path from "path";

import { config } from "dotenv";
config();

import { EvalResult } from "./types";

const runsPath = path.join(__dirname, "runs");

async function viewResults(runNumber: string) {
  // Read the generations file
  const results: any[] = JSON.parse(
    fs.readFileSync(path.join(runsPath, runNumber, "evaluations.json"), "utf8")
  ).map((result: EvalResult) => ({
    ...result,
    dependencies: JSON.parse(result.packageDotJSON).dependencies,
    screenshot: fs.existsSync(path.join(runsPath, runNumber, "screenshots", `${result.id}.png`))
  }));

  const renderedHTML = ejs.render(
    fs.readFileSync(path.join(__dirname, "views", "index.ejs"), "utf-8"),
    { results }
  );

  const outputPath = path.join(runsPath, runNumber, "index.html");
  fs.writeFileSync(outputPath, renderedHTML);
  console.log(`Wrote results to ${outputPath}.`);
}

const runNumber = process.argv[2];
if (!runNumber) {
  console.error("No run number provided. Usage: yarn evaluate <run>");
  process.exit(1);
}

viewResults(runNumber);
