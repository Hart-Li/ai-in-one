const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      webviewTag: true,
      webSecurity: false // 允许跨域，解决部分网站加载资源失败的问题
    }
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
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

