import { execSync } from 'child_process';

/**
 * Get the most recent version of a package before a given date from npm.
 * @param packageName The name of the package to query.
 * @param fieldName The field in the package metadata to use for date comparison (e.g., 'time', 'modified', etc.).
 * @param givenDate The date before which you want to find the most recent version.
 * @returns The most recent version before the given date or 'No versions found before the given date'.
 */
function getMostRecentVersionBeforeDate(packageName: string, givenDate: Date): string {
  try {
    const output = execSync(`npm view ${packageName} time --json`, { encoding: 'utf-8' });
    const fieldData = JSON.parse(output);

    // Filter versions that are before the given date
    const versionsBeforeDate = Object.keys(fieldData)
      .filter((version) => !version.includes("-") && new Date(fieldData[version]) <= givenDate);

    // Find the most recent version before the given date
    const mostRecentVersion = versionsBeforeDate.length > 0
      ? versionsBeforeDate[versionsBeforeDate.length - 1]
      : 'No versions found before the given date';

    return mostRecentVersion;
  } catch (error: any) {
    console.error(error.message);
    return 'Error occurred';
  }
}

const mostRecentVersionForChatGPT = getMostRecentVersionBeforeDate(
    'react-scripts',
    new Date('2021-09-01')
    );
const mostRecentVersion = getMostRecentVersionBeforeDate(
    'react-scripts',
    new Date('2030-01-01')
    );
console.log('Most recent version before the given date:', mostRecentVersionForChatGPT);
console.log('Most recent version:', mostRecentVersion);
