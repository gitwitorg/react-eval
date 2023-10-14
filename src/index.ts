// TODO use deleteTemporaryDirectory with reactAppDirObj as input to clear up the temp memory after each captured react app process.
import { createTemporaryFileSystem, deleteTemporaryDirectory } from './helpers/createReactFileSystem';
import { installReactDependencies, runReactAppInDev, clearPortForReactAppLaunch } from './helpers/buildReactApp';
import puppeteer, { Browser, Page } from 'puppeteer';
import { saveErrorInfo } from "./lib/firestore";

const fs = require('fs');
const path = require('path');


const PACKAGE_JSON_TEMPLATE = `
"dependencies": {
        "react": "^18.0.0",
            "react-dom": "^18.0.0",
                "react-scripts": "^4.0.0"
},
"scripts": {
    "start": "react-scripts --openssl-legacy-provider start"
},
"main": "./src/index.js",
    "browserslist": {
    "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
    ],
        "development": [
            "last 1 chrome version",
            "last 1 firefox version",
            "last 1 safari version"
        ]
}
}`;

async function captureReactAppOutput(logErrorsOnly = true): Promise<Array<string>> {
    const errorSet = new Set<string>();
    const browser: Browser = await puppeteer.launch({ headless: true });
    const page: Page = await browser.newPage();

    !logErrorsOnly && page.on('console', (msg) => {
        console.log(`React App Console [${msg.type()}]:`, msg.text());
    });

    // Capture uncaught exceptions from the React app
    page.on('pageerror', (err) => {
        // console.log('React App Error:', err.message);
        errorSet.add(err.message);
    });

    await page.goto('http://localhost:3000');
    // Wait for 2 seconds for everything to load
    // TODO test to see if we need to timeout at all in order to capture errors.
    await new Promise(r => setTimeout(r, 2000));

    await browser.close();

    console.log(`Captured React App ERRORS:`, [...errorSet]);
    return [...errorSet];
}

function getCleanedHeliconeData(heliconeData: Record<string, any>): Record<string, string> | null {
    // LLM response code
    const LLMresponse = heliconeData.responseBody.choices[0].message.content;

    // Extract the content between the three backticks
    const regex = /```([\s\S]*?)```/g;
    const match = regex.exec(LLMresponse);

    if (match && match[1]) {
        let extractedContent = match[1].trim();

        // Split the content by newline and remove the first line as it's not necessary
        const lines = extractedContent.split('\n').slice(1);
        extractedContent = lines.join('\n');

        // Extract imported libraries
        const importLines = lines.filter(line => line.startsWith('import'));
        const libraries = importLines.map(line => {
            const match = line.match(/'([^']+)'/);
            return match ? match[1] : null;
        }).filter(lib => lib && !lib.includes('react') && !lib.includes('tailwind'));

        // Modify PACKAGE_JSON_TEMPLATE to include the libraries
        const dependenciesIndex = PACKAGE_JSON_TEMPLATE.indexOf('"dependencies": {') + 17;
        const dependenciesToAdd = libraries.map(lib => `"${lib}": "*"`).join(',\n');
        const modifiedPackageJson = [
            PACKAGE_JSON_TEMPLATE.slice(0, dependenciesIndex),
            dependenciesToAdd,
            libraries.length > 0 ? ',' : '', // Add comma after the last new library
            PACKAGE_JSON_TEMPLATE.slice(dependenciesIndex)
        ].join('');

        return {
            prompt: heliconeData.prompt,
            packageDotJSON: modifiedPackageJson,
            appDotJS: extractedContent,
        }
    } else {
        return null;
    }
}


(async () => {
    const filePath = path.join(__dirname, '..', 'helicone_gitwit_react_results.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    // TODO remove before deploy to production.
    let count = 0;

    for (const entry of jsonData) {
        // Grab necessary data from helicone
        const cleanedHeliconeData = getCleanedHeliconeData(entry);
        if (!cleanedHeliconeData) continue;

        // Create Temporary Folder/File Structure
        const { reactAppDirObj, reactAppDir } = createTemporaryFileSystem(cleanedHeliconeData.appDotJS, cleanedHeliconeData.packageDotJSON);

        // Perform child_process in-sync opperations.
        try {
            clearPortForReactAppLaunch(3000);
            installReactDependencies(reactAppDir);
        } catch (error: any) {
            deleteTemporaryDirectory(reactAppDirObj);
            console.error(error);
            continue;
        }

        // Run async child_process with react dev server.
        const { childProcess, started, exited } = runReactAppInDev(reactAppDir);
        try {
            await started;
            console.log("Child Process successfully started React App in Dev.");
        } catch (error: any) {
            deleteTemporaryDirectory(reactAppDirObj);
            console.error(`ERROR: when trying to run the React app: ${error}`);
            continue;
        }

        // Create headless browser and capture errors, if any.
        console.log("Back in the main thread. Should call captureReactAppOutput to start headless browser...");
        const reactAppErrors = await captureReactAppOutput();

        // Only save this React App data if it has an error.
        if (reactAppErrors.length) {
            try {
                await saveErrorInfo({
                    prompt: cleanedHeliconeData.prompt,
                    errors: reactAppErrors,
                    appDotJs: cleanedHeliconeData.appDotJS,
                    packageDotJson: cleanedHeliconeData.packageDotJSON,
                });
            } catch (error: any) {
                console.error(`Unable to save react app errors to DB: ${error}`)
            }
        }

        if (childProcess.kill('SIGTERM')) {
            console.log("Signal sent to child process to terminate.");
            try {
                await exited;
                console.log("Child process has been killed. Main process can continue execution...");
            } catch (error: any) {
                console.error('Unable to gracefully kill child process...')
            }
        } else {
            console.warn('Child process did not respond to SIGTERM. Sending SIGKILL to force exit.');
            childProcess.kill('SIGKILL');
        }

        // TODO test to see if I still need this.
        await new Promise(r => setTimeout(r, 1000));

        // Delete the Temporary Folder/File Structure.
        deleteTemporaryDirectory(reactAppDirObj);
    }

    // TODO remove before deploy to production.
    if (count === 1) {
        process.exit(0);
    } else {
        count++;
    }

    // Exit node process with code success to avoid CRON automatic retrial
    process.exit(0);
})();