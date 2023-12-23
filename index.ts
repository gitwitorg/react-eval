import { Sandbox } from "@e2b/sdk";
import dotenv from "dotenv";

dotenv.config();

(async () => {
  // Spawn your custom sandbox
  const sandbox = await Sandbox.create({ template: "react-evals" });

  const procWithCustomHandler = await sandbox.process.start({
    cmd: "cd /evals && npm start",
    onStdout: (data) => console.log("process", data.line),
    timeout: 3*60*1000, // 3 minutes
  });
  await procWithCustomHandler.wait();

  // Close sandbox once done
  await sandbox.close();
})();
