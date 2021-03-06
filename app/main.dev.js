/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import getConfig from './utils/config';

require('./sentry');

app.allowRendererProcessReuse = true;

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    if (getConfig().autoUpdate) {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
    } else {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
    }

    autoUpdater.allowPrerelease = false;

    // this is coming from menu.js
    ipcMain.on('search-issues', () => {
      // $FlowFixMe but .send() works in dev!
      mainWindow.send('search-issues', 'open');
    });

    ipcMain.on('update-request', event => {
      autoUpdater.on('error', error => {
        // sentry #R
        if (!error.toString().match('ENOENT')) console.error(error);

        const data = {
          available: false,
          error,
          info: {}
        };
        // sentry #W
        if (event && event.sender) event.sender.send('update-reply', data);
      });

      autoUpdater.on('update-available', info => {
        const data = {
          available: true,
          info,
          error: null
        };
        event.sender.send('update-reply', data);
      });
      try {
        // autoUpdater.checkForUpdates();
        autoUpdater.checkForUpdatesAndNotify();
      } catch (e) {
        console.error('autoUpdater.checkForUpdates problem', e);
      }
    });

    // autoUpdater.checkForUpdates();
    // setTimeout(autoUpdater.checkForUpdates, 2000);
    // autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);
  // mainWindow.maximize();

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('enter-full-screen', () => {
    if (!mainWindow) return;
    mainWindow.send('enter-full-screen', 'opened');
  });

  mainWindow.on('leave-full-screen', () => {
    if (!mainWindow) return;
    mainWindow.send('leave-full-screen', 'closed');
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
