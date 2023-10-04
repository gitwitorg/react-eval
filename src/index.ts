import path from 'path';
import { reactAppDir } from './helpers/createReactFileSystem';
import { installAndBuild } from './helpers/buildReactApp';
import express, { Express } from 'express';
import puppeteer, { Browser, Page } from 'puppeteer';

// Install dependencies and build react app
try {
    installAndBuild(reactAppDir);
} catch (error: any) {
    console.error(`Unable to install & build the React app: ${error}`);
    process.exit(1);
}

// Serve the built React app
const app: Express = express();
app.use(express.static(path.join(reactAppDir, 'dist')));
const server = app.listen(3000, () => {
    console.log('React app served on http://localhost:3000');
});

async function captureReactAppOutput() {
    const browser: Browser = await puppeteer.launch({ headless: false });
    const page: Page = await browser.newPage();

    page.on('console', (msg) => {
        console.log(`React App Console [${msg.type()}]:`, msg.text());
    });


    // Capture uncaught exceptions from the React app
    page.on('pageerror', (err) => {
        console.log('React App Error:', err.message);
        // TODO Analyse the error here.
    });

    await page.goto('http://localhost:3000/index.html');
    await new Promise(r => setTimeout(r, 30000)); // Wait for 30 seconds for everything to load

    await browser.close();
    server.close(); // Close the server after capturing the output
}

(async () => { await captureReactAppOutput() })();