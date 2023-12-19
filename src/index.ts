import { saveErrorInfo } from "./lib/firestore";
import { testReactApp, setupTestEnvironment, cleanupTestEnvironment } from "./testApp";
import { PACKAGE_JSON_TEMPLATE } from "./template";

const fs = require('fs-extra');
const path = require('path');

const dependenciesOnly = process.argv.includes('--dependencies-only');

function extractImportedLibraries(javascriptCode: string): string[] {
    // Regular expression pattern to match import statements
    const pattern = /import\s+(?:[\w\s,{}]+)\s+from\s+['"]([^'"]+)['"]/g;

    // Find all matches in the JavaScript code
    const matches = [...javascriptCode.matchAll(pattern)];

    // Extract and return the unique imported library names as a list
    const importedLibraryNamesSet = new Set<string>();
    for (const match of matches) {
        const [, libraryName] = match;
        importedLibraryNamesSet.add(libraryName);
    }

    // Convert the set to an array and return it
    const importedLibraryNames = Array.from(importedLibraryNamesSet);
    return importedLibraryNames;
}

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
    const extractedContent = stripFences(LLMresponse) || LLMresponse;

    // Extract the dependencies from the code to build the package.json.
    let packageJson = JSON.parse(PACKAGE_JSON_TEMPLATE)
    const importedLibraries = extractImportedLibraries(extractedContent);
    const nDependencies = Object.keys(packageJson.dependencies).length;
    importedLibraries.forEach((key) => {
        packageJson.dependencies[key] ??= "*";
    });
    if (dependenciesOnly && Object.keys(packageJson.dependencies).length == nDependencies) {
        console.error(`Skipping because the code doesn't import any libraries.`)
        return null;
    }
    const modifiedPackageJson = JSON.stringify(packageJson, null, 4);

    return {
        prompt: heliconeData.prompt,
        packageDotJSON: modifiedPackageJson,
        appDotJS: extractedContent,
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