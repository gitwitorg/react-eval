import { execSync, spawn } from 'child_process';

export function installAndBuild(reactAppPath: string): void {
    try {
        console.log('Starting installation of react dependencies...');

        execSync(`cd ${reactAppPath} && npm install`, { stdio: 'inherit' });

        console.log('Installation completed.');
    } catch (error) {
        throw new Error(`Error during installation and build: ${error}`);
    }
}

export function runReactAppInDev(reactAppPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const child = spawn('npm', ['run', 'start'], {
                cwd: reactAppPath
            });

            child.stdout.on('data', (data) => {
                console.log(`stdout of the child process that runs the react app in dev: ${data}`);
                // Check for a specific log message that indicates the React app has started.
                // This hack allows us to only resolve the promise once the child process properly started up the react dev server.
                if (data.includes('localhost:3000')) {
                    resolve();
                }
            });

            child.stderr.on('data', (data) => {
                console.error(`stderr of the child process that runs the react app in dev: ${data}`);
            });

            child.on('close', (code) => {
                console.log(`child process that runs the react app in dev exited with code ${code}`);
            });
        } catch (error: any) {
            reject(new Error(`Unable to run the app: ${error}`));
        }
    });
}














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
