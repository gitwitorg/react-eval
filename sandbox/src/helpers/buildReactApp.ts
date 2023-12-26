import { execSync, spawn, ChildProcess } from 'child_process';


export function clearPortForReactAppLaunch(port: number): void {
    try {
        const pid = execSync(`lsof -t -i:${port}`, { encoding: 'utf8' }).trim();
        console.log(`pid is ${pid}`);
        if (pid) {
            execSync(`kill -9 ${pid}`);
            console.log(`Successfully killed process on port ${port}`);
        } else {
            console.log(`No process running on port ${port}`);
        }
    } catch (error: any) {
        // Check if the error is due to no process running on the port
        if (error.status === 1 && !error.stdout && !error.stderr) {
            console.log(`No process running on port ${port}`);
        } else {
            throw new Error(`Unable to clear port ${port}. ERROR: ${error.message}`);
        }
    }
}

export function installReactDependencies(reactAppPath: string): void {
    try {
        console.log('Installing react dependencies...');

        execSync(`cd ${reactAppPath} && npm install --legacy-peer-deps`, { stdio: 'inherit' });

        console.log('Installation completed.');
    } catch (error) {
        throw new Error(`Error during installation and build: ${error}`);
    }
}

export function runReactAppInDev(reactAppPath: string): { childProcess: ChildProcess, started: Promise<void>, exited: Promise<number | null> } {
    const child = spawn('npm', ['run', 'start'], {
        cwd: reactAppPath
    });

    const started = new Promise<void>((resolve, _) => {
        child.stdout.on('data', (data) => {
            console.log(`STDOUT child_process: ${data}`);
            if (data.includes('webpack compiled successfully') || data.includes('Failed to compile')) {
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
