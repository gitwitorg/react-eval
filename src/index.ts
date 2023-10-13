// // TODO use deleteTemporaryDirectory with reactAppDirObj as input to clear up the temp memory after each captured react app process.
// import { reactAppDir, reactAppDirObj, deleteTemporaryDirectory } from './helpers/createReactFileSystem';
// import { installAndBuild, runReactAppInDev, clearPortForReactAppLaunch } from './helpers/buildReactApp';
// import puppeteer, { Browser, Page } from 'puppeteer';
// import { saveErrorInfo } from "./lib/firestore";


// async function captureReactAppOutput(logErrorsOnly = true): Promise<void> {
//     const errorSet = new Set<string>();
//     const browser: Browser = await puppeteer.launch({ headless: true });
//     const page: Page = await browser.newPage();

//     !logErrorsOnly && page.on('console', (msg) => {
//         console.log(`React App Console [${msg.type()}]:`, msg.text());
//     });

//     // Capture uncaught exceptions from the React app
//     page.on('pageerror', (err) => {
//         // console.log('React App Error:', err.message);
//         errorSet.add(err.message);
//     });

//     await page.goto('http://localhost:3000');
//     await new Promise(r => setTimeout(r, 5000)); // Wait for 5 seconds for everything to load

//     // TODO return the errorSet and then loop over the errors in the main function and pass them to a different function that you import
//     // that deals with saving them in the DB. Make this function part of a file in lib folder. 
//     console.log(`Captured React App ERRORS:`, [...errorSet]);


//     await browser.close();
// }

// (async () => {
//     // Perform child_process in-sync opperations.
//     try {
//         clearPortForReactAppLaunch(3000);
//         installAndBuild(reactAppDir);
//     } catch (error: any) {
//         console.error(error);
//         process.exit(1);
//     }

//     // Run async child_process with react dev server.
//     const { childProcess, started } = runReactAppInDev(reactAppDir);
//     try {
//         await started;
//         console.log("Child Process successfully started React App in Dev.");
//     } catch (error: any) {
//         console.error(`ERROR: when trying to run the React app: ${error}`);
//         process.exit(1);
//     }

//     console.log("Back in the main thread. Should call captureReactAppOutput to start headless browser...");
//     await captureReactAppOutput();

//     if (childProcess.kill()) {
//         console.log("Child process has been killed. Main process should exit in 5 seconds...")
//     } else {
//         console.error("Unable to kill child_process.")
//     }

//     // Force nodejs process to terminate which will also terminate the dev react server on the child_process.
//     await new Promise(r => setTimeout(r, 5000));
//     process.exit(0);
// })();



// TODO use a tempalte package.json, then add whatever got imported in the app.json as a global import: whatever_package: "*"
import fs from 'fs';
import path from 'path';

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

(async () => {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '..', 'helicone_gitwit_react_results.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    let count = 0;

    jsonData.forEach((entry: any) => {
        // LLM response code
        const LLMresponse = entry.responseBody.choices[0].message.content;

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

            console.log('Modified PACKAGE_JSON_TEMPLATE:', modifiedPackageJson);


            console.log('Extracted Content:', extractedContent);
        }

        if (count === 1) {
            process.exit(0);
        } else {
            count++;
        }
    });




})();







// import { saveErrorInfo } from "./lib/firestore";

// const appErrorData = {
//     prompt: "some prompt",
//     error: ["error 1", "error 2"],
//     appDotJs: "some app.js code",
//     packageDotJson: "some pacakage.json code",
//     tailwindJSdotConfig: "some tailwind config"
// };

// (async () => {
//     try {
//         await saveErrorInfo(appErrorData);
//     } catch (error: any) {
//         console.log(error);
//     }
// })();