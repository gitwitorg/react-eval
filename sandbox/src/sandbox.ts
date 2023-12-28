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
import path from 'path';

// Initialise env variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function captureReactAppOutput(
  logErrorsOnly = true
): Promise<{ errors: string[]; screenshot: Buffer }> {
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
  const screenshot = await page.screenshot({ encoding: "binary" });

  await browser.close();

  // Remove the child_processes-specific error message from the set
  errorSet.delete("process is not defined");

  return { errors: [...errorSet], screenshot };
}

export async function testReactApp() {
  // Create Temporary Folder/File Structure
  console.log("Copying React app to temporary directory...");
  const { reactAppDirObj, reactAppDir } = createTemporaryFileSystem();

  // Perform child_process in-sync opperations.
  try {
    console.log("Clearing port 3000...");
    clearPortForReactAppLaunch(3000);
    console.log("Installing React App Dependencies...")
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
  try {
    console.log("Deleting temporary directory...");
    deleteTemporaryDirectory(reactAppDirObj);
  } catch (error: any) {
    console.error(error);
  }

  return {
    errors: reactAppErrors,
    screenshot: reactAppScreenshot,
  };
}
