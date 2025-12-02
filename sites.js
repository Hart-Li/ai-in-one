module.exports = [
  {
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    inputSelector: 'textarea#chat-input, textarea', 
    buttonSelector: null, 
    submitType: 'enter', 
  },
  {
    name: '通义千问 (Qwen)',
    url: 'https://tongyi.aliyun.com/qianwen/',
    inputSelector: 'textarea',
    buttonSelector: 'button[class*="ant-btn"]', 
    submitType: 'click', 
  },
  {
    name: 'Kimi (Moonshot)',
    url: 'https://kimi.moonshot.cn/',
    inputSelector: 'div[contenteditable="true"]', 
    buttonSelector: 'div[class*="sendButton"], button[class*="sendButton"]', 
    submitType: 'click',
  },
  {
    name: '字节豆包',
    url: 'https://www.doubao.com/',
    inputSelector: 'div[contenteditable="true"], textarea',
    buttonSelector: 'button[class*="send-btn"]',
    submitType: 'click',
  },
  {
    name: '文心一言',
    url: 'https://yiyan.baidu.com/',
    // 简化选择器，优先匹配 ID
    inputSelector: '#erp-text-input, div.yc-editor, div[contenteditable="true"]', 
    buttonSelector: 'div[class*="send-btn"], button[class*="send"]',
    submitType: 'click',
  },
  {
    name: '腾讯元宝',
    url: 'https://yuanbao.tencent.com/',
    inputSelector: 'div[contenteditable="true"]',
    buttonSelector: 'div[class*="send-btn"], button[class*="send"]',
    submitType: 'click',
  },
  {
    name: '知乎直答',
    url: 'https://zhida.zhihu.com/',
    inputSelector: 'textarea, div[contenteditable="true"]',
    buttonSelector: null,
    submitType: 'enter',
  },
  {
    name: 'Google Gemini (需科学上网)',
    url: 'https://gemini.google.com/',
    inputSelector: 'div[contenteditable="true"]',
    buttonSelector: 'button[class*="send-button"]',
    submitType: 'click',
  },
  {
    name: 'ChatGPT (需科学上网)',
    url: 'https://chatgpt.com/',
    inputSelector: '#prompt-textarea',
    buttonSelector: 'button[data-testid="send-button"]',
    submitType: 'click',
  }
];
