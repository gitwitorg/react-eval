import { saveErrorInfo } from "./lib/firestore";
import { testReactApp, setupTestEnvironment, cleanupTestEnvironment } from "./testApp";
import { packageDotJSONFromAppDotJS } from "./helpers/gitwit";

const fs = require('fs-extra');
const path = require('path');

function getCleanedHeliconeData(heliconeData: Record<string, any>): Record<string, string> | null {
    // The response itself is JSON, so we should parse it:
    const LLMresponse = JSON.parse(heliconeData.response)?.content;

    // This is the same function as used by the GitWit app.
    const stripFences = (code: string) => {
        const parts = code.split(/[\r\n]?```(?!bash)[A-z]*[\r\n]?/g);
        if (parts.length > 1) {
            return parts[1];
        }
        return "";
    };

    // Extract the code from the response.
    const appDotJS = stripFences(LLMresponse) || LLMresponse;
    const packageDotJSON = packageDotJSONFromAppDotJS(appDotJS);

    return {
        prompt: heliconeData.prompt,
        packageDotJSON,
        appDotJS,
        projectID: heliconeData.id,
    }
}

(async () => {
    const filePath = path.join(__dirname, '..', 'helicone_gitwit_react_results.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(rawData);

    // TODO remove before deploy to production.
    // let count = 0;

    setupTestEnvironment();

    for (const entry of jsonData) {
        // Wrap each entry in a try/catch to avoid the entire process from failing.
        try {

            // Logging current entry:
            console.log(`Current entry is: ${entry.id}`)

            // Grab necessary data from helicone
            const cleanedHeliconeData = getCleanedHeliconeData(entry);
            if (!cleanedHeliconeData) {
                console.error(`Unable to find the response code from LLM. Failure in regex.`)
                continue;
            }
        
        const result = await testReactApp(cleanedHeliconeData.appDotJS, cleanedHeliconeData.packageDotJSON);

        // Only save this React App data if it has an error.
        if (result) {
          try {
            await saveErrorInfo({
              prompt: cleanedHeliconeData.prompt,
              errors: result.reactAppErrors,
              appDotJs: cleanedHeliconeData.appDotJS,
              packageDotJson: cleanedHeliconeData.packageDotJSON,
              projectID: cleanedHeliconeData.projectID,
              screenshot: result.reactAppScreenshot,
            });
          } catch (error: any) {
            console.error(`Unable to save react app errors to DB: ${error}`);
          }
        }
        else {
            console.log(`No data to save.`)
        }

        } catch (error: any) {
            console.error(`ERROR: when trying to test the React app: ${error}`);
            continue;
        }
    }
    
    cleanupTestEnvironment();

    // Exit node process with code success to avoid CRON automatic retrial
    process.exit(0);
})();