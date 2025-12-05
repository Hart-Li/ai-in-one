# 🤖 AI IN ONE (聚合AI助手)

![License](https://img.shields.io/badge/license-Apache_2.0-blue.svg)
![Electron](https://img.shields.io/badge/Electron-33.x-yellow.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey.svg)

**AI IN ONE** 是一个基于 Electron 开发的桌面端效率工具，旨在解决多模型并发使用的痛点。它允许你在一个窗口内同时与多个顶尖 AI 模型对话，实现“一次输入，全网分发”，极大地提升了信息对比和获取的效率。

![应用介绍](assets/images/desc.gif)

---

## ✨ 核心功能

* **🚀 一键群发**：统一输入框，自动同步发送给所有选中的 AI 模型，发送后光标仍停留在输入框便于连续提问
* **⚡️ 并行响应**：多 Webview 架构，所有模型同时生成回答，无需等待
* **🧩 灵活布局与窗口管理**：
  * 支持 1-4 个模型显示，自动根据数量切换布局（单屏 / 双分屏 / 三分屏 / 四宫格）
  * 4 个模型时可在四宫格与平铺两种布局间切换
  * 单窗口支持最大化，其他窗口自动隐藏，再次点击还原
* **💾 状态持久化**：
  * 自动登录保持：基于 Partition 持久化存储，重启应用无需重复登录
  * 上下文保留：切换模型显示/隐藏时，聊天记录不会丢失
* **🛠 实用工具**：
  * 每个窗口独立刷新（重新加载当前站点，保持会话）
  * 登录状态检测与红绿灯提示
  * 一键在系统默认浏览器打开当前模型页面
  * 至少需选中 1 个模型（最多 4 个），默认选中 DeepSeek 与通义千问
  * 支持 Markdown 和代码高亮（取决于各 AI 网页端原生支持）

---

## 🧠 支持模型

目前已适配 9 大主流 AI 模型：

| 模型名称 | 网址 | 说明 |
| :--- | :--- | :--- |
| **DeepSeek** | chat.deepseek.com | 深度求索 |
| **通义千问** | tongyi.aliyun.com | 阿里 Qwen，无需登录 |
| **Kimi** | kimi.moonshot.cn | 月之暗面 |
| **字节豆包** | doubao.com | 字节跳动，无需登录 |
| **文心一言** | yiyan.baidu.com | 百度 ERNIE |
| **腾讯元宝** | yuanbao.tencent.com | 腾讯 Hunyuan |
| **知乎直答** | zhida.zhihu.com | 知乎搜索 AI |
| **Google Gemini** | gemini.google.com | *需科学上网*，无需登录 |
| **ChatGPT** | chatgpt.com | *需科学上网*，无需登录 |

---

## 📥 安装与使用

### 下载应用

可以直接下载预编译的安装包：

**📦 [下载最新版本 (v1.0.0)](https://github.com/Hart-Li/ai-in-one/releases/tag/v1.0.0)**

支持 macOS (.dmg) 和 Windows (.exe) 平台。

---

### 前置要求
*   [Node.js](https://nodejs.org/) (建议 v16+)
*   npm 或 pnpm

### 开发运行

1.  **克隆项目**
    ```bash
    git clone https://github.com/your-username/ai-in-one.git
    cd ai-in-one
    ```

2.  **安装依赖**
    ```bash
    npm install
    # 如果遇到 electron 下载慢，请先设置镜像:
    # export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
    ```

3.  **启动应用**
    ```bash
    npm start
    ```

### 打包发布

支持构建 macOS (.dmg) 和 Windows (.exe) 安装包。

```bash
# 打包 macOS 应用
npm run build:mac

# 打包 Windows 应用
npm run build:win
```

产物将生成在 `dist/` 目录下。

---

## 🛠 技术栈

*   **Electron**: 跨平台桌面应用框架
*   **Webview**: 嵌入式网页容器，用于加载第三方 AI 官网
*   **HTML/CSS/JS**: 原生前端技术栈，轻量高效
*   **Electron-Builder**: 打包构建工具

---

## 📜 更新日志

- 查看详细版本更新说明： [CHANGELOG.md](./CHANGELOG.md)

---

## ⚠️ 注意事项

1.  **账号登录**：本应用仅作为网页聚合器，不提供账号服务。你需要自行在各个 AI 官网登录你的账号。
2.  **隐私安全**：本应用不远程存储用户任何信息，无任何安全风险，只在电脑本地记录登录状态，确保你的账号和数据安全。
3.  **网络环境**：部分国外模型（ChatGPT, Gemini）需要特定的网络环境才能访问。
4.  **页面兼容性**：由于 AI 网站更新频繁，如果遇到无法输入或发送的情况，可能需要更新 `sites.js` 中的 DOM 选择器。

---

## 📄 License

[Apache-2.0](./LICENSE) © Hart Li

