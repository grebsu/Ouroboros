// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendTimerCommand: (command) => ipcRenderer.send('timer-command', command),
  onTimerTick: (callback) => ipcRenderer.on('timer-tick', (event, ...args) => callback(...args)),
  removeTimerTickListeners: () => ipcRenderer.removeAllListeners('timer-tick'),
  updateTitlebarColor: (colors) => ipcRenderer.send('update-titlebar-color', colors),
});
