"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReactAppInDev = exports.installReactDependencies = exports.clearPortForReactAppLaunch = void 0;
const child_process_1 = require("child_process");
function clearPortForReactAppLaunch(port) {
    try {
        const pid = (0, child_process_1.execSync)(`lsof -t -i:${port}`, { encoding: 'utf8' }).trim();
        console.log(`pid is ${pid}`);
        if (pid) {
            (0, child_process_1.execSync)(`kill -9 ${pid}`);
            console.log(`Successfully killed process on port ${port}`);
        }
        else {
            console.log(`No process running on port ${port}`);
        }
    }
    catch (error) {
        // Check if the error is due to no process running on the port
        if (error.status === 1 && !error.stdout && !error.stderr) {
            console.log(`No process running on port ${port}`);
        }
        else {
            throw new Error(`Unable to clear port ${port}. ERROR: ${error.message}`);
        }
    }
}
exports.clearPortForReactAppLaunch = clearPortForReactAppLaunch;
function installReactDependencies(reactAppPath) {
    try {
        console.log('Installing react dependencies...');
        (0, child_process_1.execSync)(`cd ${reactAppPath} && npm install`, { stdio: 'inherit' });
        console.log('Installation completed.');
    }
    catch (error) {
        throw new Error(`Error during installation and build: ${error}`);
    }
}
exports.installReactDependencies = installReactDependencies;
function runReactAppInDev(reactAppPath) {
    const child = (0, child_process_1.spawn)('npm', ['run', 'start'], {
        cwd: reactAppPath
    });
    const started = new Promise((resolve, reject) => {
        child.stdout.on('data', (data) => {
            console.log(`STDOUT child_process: ${data}`);
            if (data.includes('localhost:3000')) {
                resolve();
            }
        });
        child.stderr.on('data', (data) => {
            console.error(`STDERR child_process: ${data}`);
        });
    });
    const exited = new Promise((resolve) => {
        child.on('exit', (code) => {
            console.log(`Child process exited with code ${code}`);
            resolve(code);
        });
    });
    return { childProcess: child, started, exited };
}
exports.runReactAppInDev = runReactAppInDev;
// import { spawn } from 'child_process';
// export function installAndBuild(reactAppPath: string): Promise<string> {
//     return new Promise((resolve, reject) => {
//         const command = spawn('sh', ['-c', `cd ${reactAppPath} && npm install vite && npm install`]);
//         command.stdout.on('data', (data) => {
//             console.log(`stdout: ${data}`);
//         });
//         command.stderr.on('data', (data) => {
//             console.error(`stderr: ${data}`);
//         });
//         command.on('close', (code) => {
//             if (code !== 0) {
//                 reject(new Error(`Command exited with code: ${code}`));
//             } else {
//                 resolve(`Command completed with code: ${code}`);
//             }
//         });
//     });
// }
