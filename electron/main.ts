import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;
let serverPort = 5000;

// Start the Express server as a subprocess
function startServer(): Promise<number> {
    return new Promise((resolve, reject) => {
        const isDev = !app.isPackaged;

        if (isDev) {
            // In development, use tsx to run the server
            serverProcess = spawn('npx', ['tsx', '--env-file=.env', 'server/index.ts'], {
                cwd: app.getAppPath(),
                env: {
                    ...process.env,
                    NODE_ENV: 'development',
                    IS_DESKTOP: 'true',
                    PORT: serverPort.toString(),
                    DATABASE_URL: `sqlite:${path.join(app.getPath('userData'), 'database.db')}`,
                }
            });
        } else {
            // In production, run the built server bundle
            serverProcess = spawn('node', ['dist/index.cjs'], {
                cwd: app.getAppPath(),
                env: {
                    ...process.env,
                    NODE_ENV: 'production',
                    IS_DESKTOP: 'true',
                    PORT: serverPort.toString(),
                    DATABASE_URL: `sqlite:${path.join(app.getPath('userData'), 'database.db')}`,
                }
            });
        }

        serverProcess.stdout?.on('data', (data) => {
            console.log(`Server: ${data}`);
            const output = data.toString();
            if (output.includes('serving on port')) {
                resolve(serverPort);
            }
        });

        serverProcess.stderr?.on('data', (data) => {
            console.error(`Server Error: ${data}`);
        });

        serverProcess.on('error', (error) => {
            console.error('Failed to start server:', error);
            reject(error);
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            resolve(serverPort);
        }, 30000);
    });
}

function createWindow(port: number) {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, '../build/icon.png'),
    });

    // Load the app from the local server
    mainWindow.loadURL(`http://localhost:${port}`);

    // Open DevTools in development
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', async () => {
    try {
        const port = await startServer();
        createWindow(port);
    } catch (error) {
        console.error('Failed to start application:', error);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null && serverProcess) {
        createWindow(serverPort);
    }
});

app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
