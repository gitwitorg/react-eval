import { execSync, spawn, ChildProcess } from 'child_process';


export function clearPortForReactAppLaunch(port: number): void {
    try {
        execSync(`kill -9 $(lsof -t -i:${port})`);

        console.log(`Successfully killed process on port ${port}`);
    } catch (error: any) {
        throw new Error(`Unable to clear port ${port}. ERROR: ${error}`)
    }
}

export function installReactDependencies(reactAppPath: string): void {
    try {
        console.log('Installing react dependencies...');

        execSync(`cd ${reactAppPath} && npm install`, { stdio: 'inherit' });

        console.log('Installation completed.');
    } catch (error) {
        throw new Error(`Error during installation and build: ${error}`);
    }
}

export function runReactAppInDev(reactAppPath: string): { childProcess: ChildProcess, started: Promise<void>, exited: Promise<number | null> } {
    const child = spawn('npm', ['run', 'start'], {
        cwd: reactAppPath
    });

    const started = new Promise<void>((resolve, reject) => {
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

    const exited = new Promise<number | null>((resolve) => {
        child.on('exit', (code) => {
            console.log(`Child process exited with code ${code}`);
            resolve(code);
        });
    });

    return { childProcess: child, started, exited };
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
