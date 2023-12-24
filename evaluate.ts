import { Sandbox } from "@e2b/sdk";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  const sandbox = await Sandbox.create({
    template: "react-evals",
    cwd: "/evals",
    timeout: 3 * 60 * 1000, // 3 minutes
  });

  const procWithCustomHandler = await sandbox.process.start({
    cmd: "npm start",
    onStdout: (data) => console.log("process", data.line),
  });
  await procWithCustomHandler.wait();

  await sandbox.close();
})();
