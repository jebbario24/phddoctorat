"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
let mainWindow = null;
let serverProcess = null;
let serverPort = 5000;
// Start the Express server as a subprocess
function startServer() {
    return new Promise((resolve, reject) => {
        const isDev = !electron_1.app.isPackaged;
        if (isDev) {
            // In development, use tsx to run the server
            serverProcess = (0, child_process_1.spawn)('npx', ['tsx', '--env-file=.env', 'server/index.ts'], {
                cwd: electron_1.app.getAppPath(),
                env: {
                    ...process.env,
                    NODE_ENV: 'desktop',
                    PORT: serverPort.toString(),
                    DATABASE_URL: `sqlite:${path_1.default.join(electron_1.app.getPath('userData'), 'database.db')}`,
                },
                shell: true,
            });
        }
        else {
            // In production, run the built server bundle
            serverProcess = (0, child_process_1.spawn)('node', ['dist/index.cjs'], {
                cwd: electron_1.app.getAppPath(),
                env: {
                    ...process.env,
                    NODE_ENV: 'desktop',
                    PORT: serverPort.toString(),
                    DATABASE_URL: `sqlite:${path_1.default.join(electron_1.app.getPath('userData'), 'database.db')}`,
                },
                shell: true,
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
function createWindow(port) {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path_1.default.join(__dirname, '../build/icon.png'),
    });
    // Load the app from the local server
    mainWindow.loadURL(`http://localhost:${port}`);
    // Open DevTools in development
    if (!electron_1.app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.on('ready', async () => {
    try {
        const port = await startServer();
        createWindow(port);
    }
    catch (error) {
        console.error('Failed to start application:', error);
        electron_1.app.quit();
    }
});
electron_1.app.on('window-all-closed', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null && serverProcess) {
        createWindow(serverPort);
    }
});
electron_1.app.on('before-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});
