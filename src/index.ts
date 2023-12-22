import {
  testReactApp
} from "./testApp";

(async () => {
  const result = await testReactApp();

  console.log({
    errors: result?.reactAppErrors,
    screenshot: result?.reactAppScreenshot,
  });

  // Exit node process with code success to avoid CRON automatic retrial
  process.exit(0);
})();
