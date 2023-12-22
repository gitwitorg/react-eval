import fs from "fs-extra";

const packageDotJsonData = fs.readFileSync('./app/package.json', 'utf8');
const packageDotJson = JSON.parse(packageDotJsonData);

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

export function packageDotJSONFromAppDotJS(appJS: string) {
  // Extract the dependencies from the code to build the package.json.
  const importedLibraries = extractImportedLibraries(appJS);
  importedLibraries.forEach((key) => {
    packageDotJson.dependencies[key] ??= "*";
  });
  return JSON.stringify(packageDotJson, null, 4);
}
