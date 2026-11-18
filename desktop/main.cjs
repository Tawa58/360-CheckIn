const {app, BrowserWindow, shell} = require('electron');
const path = require('node:path');

app.setName('CheckIn360');
app.setAppUserModelId('app.checkin360.admin');

const isPackaged = app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173/';

/** @type {BrowserWindow | null} */
let mainWindow = null;

function isAllowedNavigation(url) {
  if (url.startsWith('file://')) {
    return true;
  }
  if (url.startsWith(DEV_URL)) {
    return true;
  }
  return /(?:^|\.)(firebaseapp\.com|firebaseio\.com|googleapis\.com|gstatic\.com|google\.com|firebase\.com)$/i.test(
    (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return '';
      }
    })(),
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0B3A42',
    title: 'CheckIn360',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({url}) => {
    shell.openExternal(url);
    return {action: 'deny'};
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAllowedNavigation(url)) {
      return;
    }
    event.preventDefault();
    if (/^https?:/i.test(url)) {
      shell.openExternal(url);
    }
  });

  if (isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  } else {
    mainWindow.loadURL(DEV_URL);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  });

  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
