const sites = require('./sites');
const { shell } = require('electron');

const grid = document.getElementById('webview-grid');
const mainInput = document.getElementById('main-input');
const sendBtn = document.getElementById('send-btn');
const modelSelector = document.getElementById('model-selector');
const layoutToggle = document.getElementById('layout-toggle');
const layoutBtn = document.getElementById('layout-btn');

// 状态管理
const MAX_SELECTED = 4;
let activeModels = []; 
const webviewMap = new Map();
let layoutMode = 'grid'; // 'grid' = 四宫格, 'row' = 平铺 

// 初始化 Checkbox (默认选中 DeepSeek 和 Qwen)
const defaultNames = ['DeepSeek', '通义千问 (Qwen)'];
activeModels = [...defaultNames];

sites.forEach(site => {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = site.name;
  checkbox.checked = defaultNames.includes(site.name);
  
  checkbox.addEventListener('change', (e) => {
    handleCheckboxChange(site.name, e.target.checked, e.target);
  });

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(site.name));
  modelSelector.appendChild(label);
});

// 初始化 Webviews
function getOrCreateWebviewWrapper(site) {
  if (webviewMap.has(site.name)) {
    return webviewMap.get(site.name);
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'webview-wrapper';
  wrapper.style.display = 'none';
  wrapper.style.order = '9999'; 
  
  const safeName = site.name.replace(/[^a-zA-Z0-9-_]/g, '_');

  const header = document.createElement('div');
  header.className = 'webview-header';
  header.innerHTML = `
    <div class="header-left" style="display:flex; align-items:center; gap:5px;">
        <span>${site.name}</span>
    </div>
    <div class="header-controls">
        <span id="login-tip-${safeName}" style="font-size:10px; color:#d9534f; display:none;">需要登录?</span>
        <div class="status-indicator" id="status-${safeName}" title="灰色:加载中/未登录; 绿色:就绪"></div>
        <button class="icon-btn open-browser-btn" title="在默认浏览器中打开">🌐</button>
        <button class="icon-btn maximize-btn" title="最大化/还原">⤢</button>
        <button class="icon-btn reload-btn" title="刷新页面">↻</button>
    </div>
  `;

  // 绑定在浏览器中打开事件
  const openBrowserBtn = header.querySelector('.open-browser-btn');
  if (openBrowserBtn) {
      openBrowserBtn.onclick = () => {
          const webview = wrapper.querySelector('webview');
          if (webview) {
              const currentUrl = webview.getURL();
              const urlToOpen = currentUrl && currentUrl !== 'about:blank' ? currentUrl : site.url;
              shell.openExternal(urlToOpen).catch(err => {
                  console.error(`Failed to open ${urlToOpen}:`, err);
              });
          }
      };
  }

  // 绑定刷新事件 (在创建时绑定，虽然 dom-ready 中也可以，但这里更统一)
  const reloadBtn = header.querySelector('.reload-btn');
  if (reloadBtn) {
      reloadBtn.onclick = () => {
          const webview = wrapper.querySelector('webview');
          if (webview) {
              // 获取当前URL，刷新到当前页面而不是首页
              const currentUrl = webview.getURL();
              if (currentUrl && currentUrl !== 'about:blank' && currentUrl !== site.url) {
                  // 如果当前URL与初始URL不同，刷新到当前URL
                  webview.src = currentUrl;
              } else {
                  // 否则使用reload（会保持当前页面）
                  webview.reload();
              }
          }
      };
  }
  
  // 绑定最大化事件 (移出 dom-ready，确保始终有效)
  const maximizeBtn = header.querySelector('.maximize-btn');
  if (maximizeBtn) {
      maximizeBtn.onclick = () => {
          const isMaximized = wrapper.classList.toggle('maximized');
          if (isMaximized) {
              grid.classList.add('has-maximized');
              maximizeBtn.textContent = '↙';
              maximizeBtn.title = '还原';
          } else {
              grid.classList.remove('has-maximized');
              maximizeBtn.textContent = '⤢';
              maximizeBtn.title = '最大化';
          }
      };
  }

  const webview = document.createElement('webview');
  webview.src = site.url;
  webview.partition = "persist:ai-in-one";  
  // 使用最新的 Windows Chrome UA，兼容性最好
  webview.useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  webview.allowpopups = true;
  
  webview.addEventListener('dom-ready', () => {
    const checkLoginScript = `
      setInterval(() => {
        const input = document.querySelector('${site.inputSelector}');
        if (input) {
            console.log('SyncChat-Status: ready');
        } else {
            console.log('SyncChat-Status: waiting');
        }
      }, 2000);
    `;
    webview.executeJavaScript(checkLoginScript).catch(() => {});
  });

  webview.addEventListener('console-message', (e) => {
    if (e.message === 'SyncChat-Status: ready') {
        const indicator = document.getElementById(`status-${safeName}`);
        const tip = document.getElementById(`login-tip-${safeName}`);
        if (indicator) indicator.classList.add('ready');
        if (tip) tip.style.display = 'none';
    } else if (e.message === 'SyncChat-Status: waiting') {
        const indicator = document.getElementById(`status-${safeName}`);
        const tip = document.getElementById(`login-tip-${safeName}`);
        if (indicator) indicator.classList.remove('ready');
        if (tip) tip.style.display = 'inline';
    }
    if (e.message.startsWith('SyncChat')) {
        // console.log(`[${site.name}]`, e.message);
    }
  });

  wrapper.appendChild(header);
  wrapper.appendChild(webview);
  
  webviewMap.set(site.name, wrapper);
  grid.appendChild(wrapper);
  
  return wrapper;
}

// Checkbox逻辑
function handleCheckboxChange(siteName, isChecked, checkboxEl) {
  if (isChecked) {
    if (activeModels.length >= MAX_SELECTED) {
      checkboxEl.checked = false;
      alert(`最多只能选择 ${MAX_SELECTED} 个模型`);
      return;
    }
    if (!activeModels.includes(siteName)) {
      activeModels.push(siteName);
    }
  } else {
    if (activeModels.length <= 1 && activeModels.includes(siteName)) {
      checkboxEl.checked = true;
      alert('至少需要保留一个模型');
      return;
    }
    activeModels = activeModels.filter(n => n !== siteName);
  }
  updateLayout();
}

// 布局更新
function updateLayout() {
  grid.classList.remove('grid-mode-1', 'grid-mode-2', 'grid-mode-3', 'grid-mode-4', 'grid');
  
  const count = activeModels.length;
  
  // 显示/隐藏布局切换按钮（只在4个模型时显示）
  if (count === 4) {
    layoutToggle.style.display = 'flex';
    // 更新按钮图标
    layoutBtn.textContent = layoutMode === 'grid' ? '||' : '⊞';
    layoutBtn.title = layoutMode === 'grid' ? '切换布局：平铺' : '切换布局：四宫格';
  } else {
    layoutToggle.style.display = 'none';
  }
  
  if (count > 0) {
    grid.classList.add(`grid-mode-${count}`);
    
    // 如果是4个模型，根据布局模式添加相应类
    if (count === 4) {
      if (layoutMode === 'grid') {
        grid.classList.add('grid'); // 四宫格布局
      }
      // 如果是 'row'，不添加 'grid' 类，使用默认的平铺布局（4列）
    }
    
    grid.style.display = 'grid';
  } else {
    grid.style.display = 'none';
  }

  webviewMap.forEach(wrapper => {
    wrapper.style.display = 'none';
  });

  activeModels.forEach((name, index) => {
    const site = sites.find(s => s.name === name);
    if (site) {
      const wrapper = getOrCreateWebviewWrapper(site);
      wrapper.style.display = 'flex';
      wrapper.style.order = index + 1;
    }
  });

  // 检查当前激活的模型中是否有最大化的窗口
  // 如果没有（例如最大化的窗口被取消选中了），则移除 grid 的 has-maximized 类，防止所有窗口被隐藏
  const hasMaximizedActive = activeModels.some(name => {
    const wrapper = webviewMap.get(name);
    return wrapper && wrapper.classList.contains('maximized');
  });

  if (!hasMaximizedActive) {
    grid.classList.remove('has-maximized');
    // 同时清理所有非激活 wrapper 的 maximized 状态，以免下次显示时状态不对（可选，但推荐）
    webviewMap.forEach((wrapper, name) => {
        if (!activeModels.includes(name)) {
            wrapper.classList.remove('maximized');
            // 还需要重置按钮图标吗？wrapper 里的按钮可能需要重置。
            // 但由于 wrapper 隐藏了，下次显示时用户也不会立即看到。
            // 为了完美，最好重置按钮。
            const maximizeBtn = wrapper.querySelector('.maximize-btn');
            if (maximizeBtn) {
                maximizeBtn.textContent = '⤢';
                maximizeBtn.title = '最大化';
            }
        }
    });
  }
}

// 布局切换处理
layoutBtn.addEventListener('click', () => {
  if (activeModels.length === 4) {
    layoutMode = layoutMode === 'grid' ? 'row' : 'grid';
    updateLayout();
  }
});

// 核心发送逻辑: 使用 insertText
async function sendToAll() {
  const text = mainInput.value;
  if (!text.trim()) return;

  const promises = activeModels.map(async (name) => {
    const site = sites.find(s => s.name === name);
    const wrapper = webviewMap.get(name);
    if (!wrapper) return;
    
    const webview = wrapper.querySelector('webview');
    if (!webview) return;

    try {
        // 1. 聚焦输入框
        const focusScript = `
            (function() {
                const input = document.querySelector('${site.inputSelector}');
                if (input) {
                    // 针对文心一言等富文本编辑器的特殊处理
                    if ('${site.name}' === '文心一言') {
                        input.click(); // 模拟点击激活
                    }
                    input.focus();
                    return true;
                }
                return false;
            })();
        `;
        const focused = await webview.executeJavaScript(focusScript);
        
        if (!focused) {
            console.warn(`[${site.name}] Input not found`);
            return;
        }

        // 2. 使用 Electron 原生能力插入文本
        await new Promise(r => setTimeout(r, 200));
        
        // 尝试先聚焦
        webview.focus();
        
        // 通用输入策略: 优先使用 insertText
        try {
            await webview.insertText(text);
        } catch (e) {
            console.log(`[${site.name}] insertText failed, fallback to JS injection`);
        }
        
        // 补充策略: 如果 insertText 后输入框依然为空(针对部分抗拒 insertText 的框架)
        // 我们注入一个更高级的 InputEvent 模拟
        await webview.executeJavaScript(`
            (function() {
                const input = document.querySelector('${site.inputSelector}');
                if (!input) return;
                
                // 检查是否已经有值 (insertText 是否成功)
                const currentVal = input.value || input.innerText || '';
                if (!currentVal.includes('${text.substring(0, 5)}')) {
                    // 如果失败，尝试构造 InputEvent
                    input.focus();
                    
                    // 针对 contenteditable
                    if (input.isContentEditable) {
                         // 既然 insertText 失败，尝试 execCommand
                         document.execCommand('insertText', false, '${text}');
                    } else {
                        // 针对 textarea/input
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set || 
                                                       Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                        if (nativeInputValueSetter) {
                            nativeInputValueSetter.call(input, '${text}');
                        } else {
                            input.value = '${text}';
                        }
                    }
                    
                    // 派发完整事件链
                    input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: '${text}' }));
                    input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: '${text}' }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            })();
        `);

        // 3. 发送 (点击或回车)
        await new Promise(r => setTimeout(r, 500)); // 增加等待时间
        
        const sendScript = `
            (function() {
                function simulateEnter(element) {
                     const eventOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true };
                     element.dispatchEvent(new KeyboardEvent('keydown', eventOpts));
                     element.dispatchEvent(new KeyboardEvent('keypress', eventOpts));
                     element.dispatchEvent(new KeyboardEvent('keyup', eventOpts));
                }

                const input = document.querySelector('${site.inputSelector}');
                let btn = null;
                if (${JSON.stringify(site.buttonSelector)}) {
                    btn = document.querySelector('${site.buttonSelector}');
                }
                
                const shouldClick = btn && '${site.submitType}' !== 'enter';
                
                if (shouldClick) {
                    btn.click();
                    // 兜底: 点击没反应则回车
                    setTimeout(() => {
                        if (input) simulateEnter(input);
                    }, 500);
                } else {
                    if (input) simulateEnter(input);
                }
            })();
        `;
        await webview.executeJavaScript(sendScript);

    } catch (err) {
        console.error(`[${site.name}] Send failed:`, err);
    }
  });

  await Promise.all(promises);
  mainInput.value = '';
  // 发送完成后聚焦到输入框
  mainInput.focus();
}

sendBtn.addEventListener('click', sendToAll);

mainInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendToAll();
  }
});

updateLayout();
