import { Sandbox } from "@e2b/sdk";
import * as fs from "fs";
import * as path from "path";

import { config } from "dotenv";
config();

import { GenerationResult, EvalResult } from "./types";

const runsPath = path.join(__dirname, "runs");

async function runEvaluations(runNumber: string) {

  // Read the generations file
  const generations : GenerationResult[] = JSON.parse(
    fs.readFileSync(path.join(runsPath, runNumber, "generations.json"), "utf8")
  );
  const completedItems: EvalResult[] = [];

  // Evaluate code for each generation
  for (const generation of generations) {

    // Create a custom sandbox with E2B
    const sandbox = await Sandbox.create({
      template: "react-evals",
      cwd: "/evals"
    });

    // Write the code to the sandbox
    sandbox.filesystem.write("/evals/app/src/App.js", generation.appDotJS);
    sandbox.filesystem.write(
      "/evals/app/package.json",
      generation.packageDotJSON
    );

    // Build and evaluate the code
    const timeout = 3 * 60 * 1000; // 3 minutes
    const procWithCustomHandler = await sandbox.process.start({
      cmd: "npm start",
      onStdout: (data) => console.log("process", data.line),
      onStderr: (data) => console.log("process", data.line),
      timeout
    });
    await procWithCustomHandler.wait(timeout);

    // Save the results
    completedItems.push({
      id: generation.id,
      prompt: generation.prompt,
      created: generation.created,
      appDotJS: generation.appDotJS,
      packageDotJSON: generation.packageDotJSON,
      screenshot: await sandbox.filesystem.read("/evals/output/screenshot.png"),
      errors: await sandbox.filesystem.read("/evals/output/errors.json"),
    });
    console.log("Completed evaluation for", generation.id);
    fs.writeFileSync(
      path.join(runsPath, runNumber, "evaluations.json"),
      JSON.stringify(completedItems, null, 2)
    );

    // Close the sandbox
    await sandbox.close();
  }
}

const runNumber = process.argv[2];
if (!runNumber) {
  console.error("No run number provided. Usage: yarn evaluate <run>");
  process.exit(1);
}

runEvaluations(runNumber);