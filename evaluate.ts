import { Sandbox } from "@e2b/sdk";
import * as fs from "fs";
import * as path from "path";

import { config } from "dotenv";
config();

import evalConfig from "./config.json";

import { GenerationResult, EvalResult } from "./types";
import { asyncMap } from "./utils";

const runsPath = "./runs"

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

// Sleep for a number of milliseconds
function sleep(ms : number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  const startTime = Date.now();
  let runningSandboxes = 0;
  let evaluationDurations: number[] = [];
  await asyncMap(generations, evalConfig.max_concurrent_evaluations || 1, async (generation: GenerationResult) => {

    // Create a custom sandbox with E2B
    let sandbox : Sandbox | null = null;
    try {
      sandbox = await Sandbox.create({
        template: "react-evals",
        cwd: "/evals",
      });
    } catch (e) {
      console.error("Error creating sandbox", e);
      throw e;
    }

    runningSandboxes++;
    console.log(`Started ${generation.id} (${runningSandboxes} evaluations in progress)`)

    try {
      const evaluationStartTime = Date.now();
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

      const duration = (Date.now() - evaluationStartTime) / 1000;
      evaluationDurations.push(duration);
      console.log(`Evaluated ${generation.id} in ${duration.toFixed(0)}s (${completedItems.length}/${generations.length})`);
    } catch (e) {
      console.error("Error evaluating", generation.id, e);
    } finally {
      if (sandbox) {
        await sandbox.close();
        // Sandboxes do not close immediately: https://github.com/e2b-dev/E2B/issues/283
        await sleep(16000); // Wait 15s + 1s margin for the sandbox to close.
        runningSandboxes--;
      }
    }
  });

  const duration = (Date.now() - startTime) / 1000;
  const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  console.log(`Finished evaluating ${completedItems.length} generations in ${duration.toFixed(0)}s (Avg. ${average(evaluationDurations)}s)`);
}

const runNumber = process.argv[2];
if (!runNumber) {
  console.error("No run number provided. Usage: yarn evaluate <run>");
  process.exit(1);
}

runEvaluations(runNumber);
