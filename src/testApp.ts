import {
  createTemporaryFileSystem,
  deleteTemporaryDirectory,
} from "./helpers/createReactFileSystem";
import {
  installReactDependencies,
  runReactAppInDev,
  clearPortForReactAppLaunch,
} from "./helpers/buildReactApp";

import puppeteer, { Browser, Page } from 'puppeteer';

import fs from "fs-extra";

const packageDotJsonData = fs.readFileSync('./app/package.json', 'utf8');

let templateAppDirObj: any = null;
let templateAppDir: string;

export function setupTestEnvironment() {
  // Create Temporary Folder/File Structure
  console.log("Creating template app...");
  ({ reactAppDirObj: templateAppDirObj, reactAppDir: templateAppDir } = createTemporaryFileSystem("/* */", packageDotJsonData));
  console.log("Installing dependencies for template app...");
  installReactDependencies(templateAppDir);
}

export function cleanupTestEnvironment() {
  // Delete the Temporary Folder/File Structure.
  deleteTemporaryDirectory(templateAppDirObj);
}

async function captureReactAppOutput(
  logErrorsOnly = true
): Promise<{ errors: string[]; screenshot: string | undefined }> {
  const errorSet = new Set<string>();
  const browser: Browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN,
  });
  const page: Page = await browser.newPage();

  !logErrorsOnly &&
    page.on("console", (msg) => {
      console.log(`React App Console [${msg.type()}]:`, msg.text());
      if (msg.text().includes("error")) {
        console.log(`Adding to errorSet: ${msg.text()}`);
        errorSet.add(msg.text());
      }
    });

  // Capture uncaught exceptions from the React app
  page.on("pageerror", (err) => {
    // console.log('React App Error:', err.message);
    errorSet.add(err.message);
  });

  await page.setDefaultNavigationTimeout(10000);
  await page.goto("http://localhost:3000", { waitUntil: "load" });

  // Capture a screenshot
  const screenshot = await page.screenshot({ encoding: "base64" });

  await browser.close();

  // Remove the child_processes-specific error message from the set
  errorSet.delete("process is not defined");

  return { errors: [...errorSet], screenshot };
}

export async function testReactApp(appDotJS: string, packageDotJSON: string) {
  // Create Temporary Folder/File Structure
  const { reactAppDirObj, reactAppDir } = createTemporaryFileSystem(
    appDotJS,
    packageDotJSON
  );
  // Copy the node_modules from the template app to the new app.
  fs.copySync(templateAppDir + "/node_modules", reactAppDir + "/node_modules");

  // Perform child_process in-sync opperations.
  try {
    clearPortForReactAppLaunch(3000);
    installReactDependencies(reactAppDir);
  } catch (error: any) {
    deleteTemporaryDirectory(reactAppDirObj);
    console.error(error);
    return null;
  }

  // Run async child_process with react dev server.
  const { childProcess, started, exited } = runReactAppInDev(reactAppDir);
  try {
    await started;
    console.log(`Child Process successfully started React App in Dev.`);
  } catch (error: any) {
    deleteTemporaryDirectory(reactAppDirObj);
    console.error(`ERROR: when trying to run the React app: ${error}`);
    return null;
  }

  // Create headless browser and capture errors, if any.
  console.log(
    "Back in the main thread. Should call captureReactAppOutput to start headless browser..."
  );
  const { errors: reactAppErrors, screenshot: reactAppScreenshot } =
    await captureReactAppOutput(false);

  if (childProcess.kill("SIGTERM")) {
    console.log("Signal sent to child process to terminate.");

    const timeoutDuration = 3000;
    const timeout = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Graceful shutdown timeout")),
        timeoutDuration
      );
    });

    try {
      // await exited or timeout, whichever finishes first.
      await Promise.race([exited, timeout]);
      console.log(
        "Child process has been killed. Main process can continue execution..."
      );
    } catch (error) {
      console.warn(
        "Child process did not respond to SIGTERM or graceful shutdown timeout. Sending SIGKILL to force exit."
      );
      childProcess.kill("SIGKILL");
    }
  }

  // TODO test to see if I still need this.
  await new Promise((r) => setTimeout(r, 1000));

  // Delete the Temporary Folder/File Structure.
  deleteTemporaryDirectory(reactAppDirObj);

  // Only save this React App data if it has an error.
  return {
    errors: reactAppErrors,
    screenshot: reactAppScreenshot,
    reactAppErrors: reactAppErrors,
    reactAppScreenshot: reactAppScreenshot,
  };

  // TODO remove before deploy to production.
  // if (count === 1) {
  //     process.exit(0);
  // } else {
  //     count++;
  // }
}
