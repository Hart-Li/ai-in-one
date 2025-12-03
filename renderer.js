const sites = require('./sites');

const grid = document.getElementById('webview-grid');
const mainInput = document.getElementById('main-input');
const sendBtn = document.getElementById('send-btn');
const modelSelector = document.getElementById('model-selector');

// 状态管理
const MAX_SELECTED = 4;
let activeModels = []; 
const webviewMap = new Map(); 

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

  const header = document.createElement('div');
  header.className = 'webview-header';
  header.innerHTML = `
    <span>${site.name}</span>
    <div class="header-controls">
        <span id="login-tip-${site.name}" style="font-size:10px; color:#d9534f; display:none;">需要登录?</span>
        <div class="status-indicator" id="status-${site.name}" title="灰色:加载中/未登录; 绿色:就绪"></div>
        <button class="reload-btn" id="reload-${site.name}" title="刷新页面">↻</button>
    </div>
  `;

  const webview = document.createElement('webview');
  webview.src = site.url;
  webview.partition = "persist:ai-in-one";  
  // 使用最新的 Windows Chrome UA，兼容性最好
  webview.useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  webview.allowpopups = true;
  
  webview.addEventListener('dom-ready', () => {
      // 绑定刷新事件 (注意：dom-ready 可能会触发多次，但我们只需要绑一次，不过这里通过 ID 查找是在 wrapper 内，相对安全)
      const reloadBtn = header.querySelector(`#reload-${site.name}`);
      if (reloadBtn) {
          reloadBtn.onclick = () => webview.reload();
      }
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
        const indicator = document.getElementById(`status-${site.name}`);
        const tip = document.getElementById(`login-tip-${site.name}`);
        if (indicator) indicator.classList.add('ready');
        if (tip) tip.style.display = 'none';
    } else if (e.message === 'SyncChat-Status: waiting') {
        const indicator = document.getElementById(`status-${site.name}`);
        const tip = document.getElementById(`login-tip-${site.name}`);
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
    activeModels = activeModels.filter(n => n !== siteName);
  }
  updateLayout();
}

// 布局更新
function updateLayout() {
  grid.classList.remove('grid-mode-1', 'grid-mode-2', 'grid-mode-3', 'grid-mode-4');
  
  const count = activeModels.length;
  if (count > 0) {
    grid.classList.add(`grid-mode-${count}`);
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
}

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
}

sendBtn.addEventListener('click', sendToAll);

mainInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendToAll();
  }
});

updateLayout();
