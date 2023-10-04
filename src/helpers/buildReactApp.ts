import { execSync } from 'child_process';

export function installAndBuild(reactAppPath: string): void {
    try {
        console.log('Starting installation and build...');

        execSync(`cd ${reactAppPath} && npm install vite && npm install && npx vite build`, { stdio: 'inherit' });

        console.log('Installation and build completed.');
    } catch (error) {
        throw new Error(`Error during installation and build: ${error}`);
    }
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
