const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const fsp = fs.promises;
const http = require("http");
const next = require("next");

let server;
let mainWindow;

// A URL que o Electron vai carregar. Em dev, será http://localhost:3000.
// Em produção, será o arquivo do build.
const startURL = process.env.ELECTRON_START_URL || "http://localhost:3000";
const isDev = !!process.env.ELECTRON_START_URL;

// --- LÓGICA DO TIMER NO PROCESSO PRINCIPAL ---
let timerState = {
  startTime: 0,
  elapsedTime: 0,
  isRunning: false,
  intervalId: null,
};

function sendTick() {
  if (timerState.isRunning && mainWindow) {
    const now = Date.now();
    const currentElapsed = timerState.elapsedTime + (now - timerState.startTime);
    mainWindow.webContents.send('timer-tick', currentElapsed);
  }
}

ipcMain.on('timer-command', (event, command) => {
  const now = Date.now();
  switch (command) {
    case 'start':
      if (!timerState.isRunning) {
        timerState.startTime = now;
        timerState.isRunning = true;
        timerState.intervalId = setInterval(sendTick, 1000);
      }
      break;
    case 'pause':
      if (timerState.isRunning) {
        timerState.elapsedTime += now - timerState.startTime;
        timerState.isRunning = false;
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
      }
      break;
    case 'reset':
      timerState.isRunning = false;
      timerState.elapsedTime = 0;
      timerState.startTime = 0;
      if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
      }
      // Envia um último tick para zerar a UI
      if (mainWindow) {
        mainWindow.webContents.send('timer-tick', 0);
      }
      break;
    case 'get-state':
       // Quando a UI pede o estado, envia o tempo atual
       sendTick();
       break;
  }
});

ipcMain.on('update-titlebar-color', (event, colors) => {
  if (mainWindow) {
    mainWindow.setTitleBarOverlay({
      color: colors.background,
      symbolColor: colors.symbols
    });
  }
});
// --- FIM DA LÓGICA DO TIMER ---

async function ensureDataDir(dataDir) {
  await fsp.mkdir(dataDir, { recursive: true });
  const bundledData = path.join(process.resourcesPath, "data");
  try {
    const files = await fsp.readdir(bundledData);
    for (const f of files) {
      const src = path.join(bundledData, f);
      const dest = path.join(dataDir, f);
      try {
        await fsp.access(dest);
      } catch {
        await fsp.copyFile(src, dest);
      }
    }
  } catch {
    // Nenhum dado inicial
  }
}

async function startNextServer() {
  const dir = path.resolve(__dirname, "..");
  const nextApp = next({ dev: false, dir }); // Sempre 'false' aqui, pois só roda em produção
  await nextApp.prepare();

  const handler = nextApp.getRequestHandler();
  server = http.createServer((req, res) => handler(req, res));

  return new Promise((resolve) => {
    server.listen(3000, () => {
      console.log("Next.js em produção rodando em http://localhost:3000");
      resolve();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js') // Adiciona o preload script
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f59e0b', // Cor da sidebar no modo claro
      symbolColor: '#FFFFFF' // Cor dos ícones (maximizar, fechar, etc)
    }
  });

  mainWindow.loadURL(startURL);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const dataDir = path.join(app.getPath("userData"), "data");
  process.env.DATA_DIR = dataDir;
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "development_secret";
  }

  await ensureDataDir(dataDir);

  // Apenas inicia o servidor se NÃO estiver em modo de desenvolvimento
  if (!isDev) {
    await startNextServer();
  }

  // Remove o menu da aplicação
  Menu.setApplicationMenu(null);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    if (server) server.close();
    app.quit();
  }
});
