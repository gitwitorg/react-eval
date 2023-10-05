import { reactAppDir } from './helpers/createReactFileSystem';
import { installAndBuild, runReactAppInDev } from './helpers/buildReactApp';
// import express, { Express } from 'express';
import puppeteer, { Browser, Page } from 'puppeteer';
import { setTimeout as delay } from 'timers/promises';


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
    try {
        installAndBuild(reactAppDir);
    } catch (error: any) {
        console.error(`ERROR: when trying to install react app dependencies: ${error}`);
        process.exit(1);
    }

    try {
        await runReactAppInDev(reactAppDir);
        console.log("I've already awaited for the child process that runs the react app to start");
    } catch (error: any) {
        console.error(`ERROR: when trying to run the React app: ${error}`);
        process.exit(1);
    }

    console.log("back in the main thread. Should call the captureReactAppOutput...");
    await captureReactAppOutput();

    // Force nodejs process to terminate which will also terminate the dev react server on the child_process.
    process.exit(0);
})();
