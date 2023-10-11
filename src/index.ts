// TODO use deleteTemporaryDirectory with reactAppDirObj as input to clear up the temp memory after each captured react app process.
import { reactAppDir, reactAppDirObj, deleteTemporaryDirectory } from './helpers/createReactFileSystem';
import { installAndBuild, runReactAppInDev, clearPortForReactAppLaunch } from './helpers/buildReactApp';
import puppeteer, { Browser, Page } from 'puppeteer';


async function captureReactAppOutput() {
    const browser: Browser = await puppeteer.launch({ headless: true });
    const page: Page = await browser.newPage();

    page.on('console', (msg) => {
        console.log(`React App Console [${msg.type()}]:`, msg.text());
    });

    // Capture uncaught exceptions from the React app
    page.on('pageerror', (err) => {
        console.log('React App Error:', err.message);
        // TODO Analyse the error here.
    });

    await page.goto('http://localhost:3000');
    await new Promise(r => setTimeout(r, 5000)); // Wait for 5 seconds for everything to load

    await browser.close();
}

(async () => {
    // Perform child_process in-sync opperations.
    try {
        clearPortForReactAppLaunch(3000);
        installAndBuild(reactAppDir);
    } catch (error: any) {
        console.error(error);
        process.exit(1);
    }

    // Run async child_process with react dev server.
    const { childProcess, started } = runReactAppInDev(reactAppDir);
    try {
        await started;
        console.log("Child Process successfully started React App in Dev.");
    } catch (error: any) {
        console.error(`ERROR: when trying to run the React app: ${error}`);
        process.exit(1);
    }

    console.log("Back in the main thread. Should call captureReactAppOutput to start headless browser...");
    await captureReactAppOutput();

    childProcess.kill();
    console.log("Child process has been killed. Main process should exit in 5 seconds...")

    // Force nodejs process to terminate which will also terminate the dev react server on the child_process.
    await new Promise(r => setTimeout(r, 5000));
    process.exit(0);
})();
