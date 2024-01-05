import { Sandbox } from "@e2b/sdk";
import * as fs from "fs";
import * as path from "path";

import { config } from "dotenv";
config();

const evalConfig = require('./config.json');

import { GenerationResult, EvalResult } from "./types";
import { asyncMap } from "./utils";

const runsPath = path.join(__dirname, "runs");

// Return undefined if the file doesn't exist rather than throwing an error
const safeRead = async <T>(
  readBytesFunction: (path: string) => Promise<T>,
  path: string
): Promise<T | undefined> => {
  try {
    return await readBytesFunction(path);
  } catch (e) {
    return undefined;
  }
};

async function runEvaluations(runNumber: string) {
  // Read the generations file
  const generations: GenerationResult[] = JSON.parse(
    fs.readFileSync(path.join(runsPath, runNumber, "generations.json"), "utf8")
  );
  const completedItems: EvalResult[] = [];

  // Set up a logs directory for this run
  const logsPath = path.join(runsPath, runNumber, "logs");
  fs.mkdirSync(logsPath, { recursive: true });

  // Evaluate code for each generation
  asyncMap(generations, evalConfig.max_concurrent_evaluations || 1, async (generation: GenerationResult) => {

    // Create a custom sandbox with E2B
    let sandbox : Sandbox | null = null;
    try {
      sandbox = await Sandbox.create({
        template: "react-evals",
        cwd: "/evals",
      });
    } catch (e) {
      console.error("Error creating sandbox", e);
      return;
    }

    try {
      const logFile = path.join(logsPath, `${generation.id}.log`);
      fs.writeFileSync(logFile, "");

      // Write the code to the sandbox
      sandbox.filesystem.write("/evals/app/src/App.js", generation.appDotJS);
      sandbox.filesystem.write(
        "/evals/app/package.json",
        generation.packageDotJSON
      );

      // Build and evaluate the code
      const procWithCustomHandler = await sandbox.process.start({
        cmd: "npm start",
        onStdout: (data) =>
          fs.appendFile(logFile, `[STDOUT] ${data.line}\n`, () => {}),
        onStderr: (data) =>
          fs.appendFile(logFile, `[STDERR] ${data.line}\n`, () => {})
      });
      const processOutput = await procWithCustomHandler.wait((evalConfig.sandbox_timeout || 60) * 1000);

      // Save the results
      const errorJSON = await safeRead(
        sandbox.filesystem.read,
        "/evals/output/errors.json"
      );
      completedItems.push({
        ...generation,
        errors: errorJSON ? JSON.parse(errorJSON) : undefined,
        exitCode: processOutput.exitCode
      });
      fs.writeFileSync(
        path.join(runsPath, runNumber, "evaluations.json"),
        JSON.stringify(completedItems, null, 2),
      );

      // Save the screenshot
      let screenshot: Uint8Array | undefined = await safeRead(
        sandbox.filesystem.readBytes,
        "/evals/output/screenshot.png"
      );
      if (screenshot) {
        const screenshotsPath = path.join(runsPath, runNumber, `screenshots`);
        fs.mkdirSync(screenshotsPath, { recursive: true });
        fs.writeFileSync(
          path.join(screenshotsPath, `${generation.id}.png`),
          screenshot
        );
      }

      console.log("Completed evaluation for", generation.id);
    } catch (e) {
      console.error("Error evaluating", generation.id, e);
    } finally {
      if (sandbox) {
        await sandbox.close();
      }
    }
  });
}

const runNumber = process.argv[2];
if (!runNumber) {
  console.error("No run number provided. Usage: yarn evaluate <run>");
  process.exit(1);
}

runEvaluations(runNumber);
