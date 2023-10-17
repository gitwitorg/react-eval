"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createReactFileSystem_1 = require("./helpers/createReactFileSystem");
const buildReactApp_1 = require("./helpers/buildReactApp");
const puppeteer_1 = __importDefault(require("puppeteer"));
const firestore_1 = require("./lib/firestore");
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
async function captureReactAppOutput(logErrorsOnly = true) {
    const errorSet = new Set();
    const browser = await puppeteer_1.default.launch({ headless: true });
    const page = await browser.newPage();
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
    // TODO look for page onload event.
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    console.log(`Captured React App ERRORS:`, [...errorSet]);
    return [...errorSet];
}
function getCleanedHeliconeData(heliconeData) {
    // LLM response code
    const LLMresponse = heliconeData.response;
    //REMOVE
    console.log(`\n\nLLM response inside getCleanedHeliconeData: ${LLMresponse}`);
    // Extract the content between the three backticks
    const regex = /```([\s\S]*?)```/g;
    const match = regex.exec(LLMresponse);
    //REMOVE
    console.log(`\nLLM response only app.js inside getCleanedHeliconeData: ${match[1]}`);
    if (match && match[1]) {
        let extractedContent = match[1].trim();
        // Split the content by newline and remove the first line as it's not necessary
        const lines = extractedContent.split('\n').slice(1);
        extractedContent = lines.join('\n');
        //REMOVE
        console.log(`\nLLM response only app.js CLEANED -no new lines- getCleanedHeliconeData: ${extractedContent}`);
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
            libraries.length > 0 ? ',' : '',
            PACKAGE_JSON_TEMPLATE.slice(dependenciesIndex)
        ].join('');
        return {
            prompt: heliconeData.prompt,
            packageDotJSON: modifiedPackageJson,
            appDotJS: extractedContent,
            projectID: heliconeData.id,
        };
    }
    else {
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
        if (!cleanedHeliconeData)
            continue;
        // Create Temporary Folder/File Structure
        const { reactAppDirObj, reactAppDir } = (0, createReactFileSystem_1.createTemporaryFileSystem)(cleanedHeliconeData.appDotJS, cleanedHeliconeData.packageDotJSON);
        // REMOVE
        console.log("\n\nCleaned Helicon data:");
        console.log(`\nprompt: ${cleanedHeliconeData.prompt}`);
        console.log(`\npackageDotJSON: ${cleanedHeliconeData.packageDotJSON}`);
        console.log(`\nappDotJS: ${cleanedHeliconeData.appDotJS}`);
        console.log(`\nprojectID: ${cleanedHeliconeData.projectID}`);
        // Perform child_process in-sync opperations.
        try {
            (0, buildReactApp_1.clearPortForReactAppLaunch)(3000);
            (0, buildReactApp_1.installReactDependencies)(reactAppDir);
        }
        catch (error) {
            (0, createReactFileSystem_1.deleteTemporaryDirectory)(reactAppDirObj);
            console.error(error);
            continue;
        }
        // Run async child_process with react dev server.
        const { childProcess, started, exited } = (0, buildReactApp_1.runReactAppInDev)(reactAppDir);
        try {
            await started;
            console.log("Child Process successfully started React App in Dev.");
        }
        catch (error) {
            (0, createReactFileSystem_1.deleteTemporaryDirectory)(reactAppDirObj);
            console.error(`ERROR: when trying to run the React app: ${error}`);
            continue;
        }
        // Create headless browser and capture errors, if any.
        console.log("Back in the main thread. Should call captureReactAppOutput to start headless browser...");
        const reactAppErrors = await captureReactAppOutput();
        // Only save this React App data if it has an error.
        if (reactAppErrors.length) {
            try {
                await (0, firestore_1.saveErrorInfo)({
                    prompt: cleanedHeliconeData.prompt,
                    errors: reactAppErrors,
                    appDotJs: cleanedHeliconeData.appDotJS,
                    packageDotJson: cleanedHeliconeData.packageDotJSON,
                    projectID: cleanedHeliconeData.projectID
                });
            }
            catch (error) {
                console.error(`Unable to save react app errors to DB: ${error}`);
            }
        }
        if (childProcess.kill('SIGTERM')) {
            console.log("Signal sent to child process to terminate.");
            try {
                await exited;
                console.log("Child process has been killed. Main process can continue execution...");
            }
            catch (error) {
                console.error('Unable to gracefully kill child process...');
            }
        }
        else {
            console.warn('Child process did not respond to SIGTERM. Sending SIGKILL to force exit.');
            childProcess.kill('SIGKILL');
        }
        // TODO test to see if I still need this.
        await new Promise(r => setTimeout(r, 1000));
        // Delete the Temporary Folder/File Structure.
        (0, createReactFileSystem_1.deleteTemporaryDirectory)(reactAppDirObj);
        // TODO remove before deploy to production.
        if (count === 1) {
            process.exit(0);
        }
        else {
            count++;
        }
    }
    // Exit node process with code success to avoid CRON automatic retrial
    process.exit(0);
})();
