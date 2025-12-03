const { app, BrowserWindow } = require('electron');
const path = require('path');

// 错误处理 - 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      webviewTag: true,
      webSecurity: false // 允许跨域，解决部分网站加载资源失败的问题
    },
    show: false // 先不显示，等加载完成后再显示
  });

  // 页面加载完成后显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 加载错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  mainWindow.loadFile('index.html');
  
  // 忽略 HTTPS 证书错误 (文心一言等国内网站有时会有中间证书问题)
  app.commandLine.appendSwitch('ignore-certificate-errors');
  app.commandLine.appendSwitch('disable-site-isolation-trials');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error('Failed to start app:', error);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

