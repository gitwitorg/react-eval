import {
  testReactApp
} from "./sandbox";

import * as fs from "fs";

(async () => {
  const result = await testReactApp();

  if (!fs.existsSync("./output")) {
    fs.mkdirSync("./output");
  }

  fs.writeFileSync("./output/errors.json", JSON.stringify( result?.errors ));
  if (result?.screenshot) {
    fs.writeFileSync("./output/screenshot.png", result?.screenshot);
  }

  // Exit node process with code success to avoid CRON automatic retrial
  process.exit(0);
})();
