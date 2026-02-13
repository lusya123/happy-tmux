<div align="center"><img src="/.github/logotype-dark.png" width="400" title="Happy Coder" alt="Happy Coder"/></div>

<h1 align="center">
  Happy Tmux — AI Agent 编排控制台
</h1>

<h4 align="center">
在 tmux 中统一管理多个 AI 编码代理，端到端加密，随时随地掌控。
</h4>

<div align="center">

[📱 **iOS**](https://apps.apple.com/us/app/happy-claude-code-client/id6748571505) • [🤖 **Android**](https://play.google.com/store/apps/details?id=com.ex3ndr.happy) • [🌐 **Web**](https://app.happy.engineering) • [📚 **文档**](https://happy.engineering/docs/) • [💬 **Discord**](https://discord.gg/fX9WBAhyfD)

</div>

<img width="5178" height="2364" alt="github" src="/.github/header.png" />

---

## 修改前 vs 修改后

| 维度 | 修改前 | 修改后 |
|------|--------|--------|
| 定位 | Claude Code / Codex 的移动端遥控器 | AI Agent 编排控制台 |
| 会话模型 | 单 agent、手动切换 | 多 agent 并行，tmux 窗口自动编排 |
| tmux 角色 | 可选附加功能 | 核心运行时，所有远程会话默认运行于 tmux |
| 交互方式 | 手机 ↔ 桌面二选一 | 手机监控 + 桌面深度操作，同时在线 |

---

## 已实现

- 通过 `happy` CLI 启动 Claude Code / Codex 会话
- 远程会话自动在 tmux 窗口中生成
- 手机端实时查看 agent 输出、授权操作
- 推送通知：权限请求、错误、任务完成
- 端到端加密，代码不离开你的设备
- 一键切换手机 / 桌面控制权
- 守护进程模式 (`happy daemon start`)

---

## 规划中

- 多 agent 并行面板：在同一 tmux session 中同时运行多个 agent
- Agent 生命周期管理：自动重启、超时回收、资源限制
- 会话录制与回放：完整记录 agent 交互历史
- 自定义编排脚本：通过配置文件定义 agent 启动流程
- Web 仪表盘：可视化查看所有 agent 状态与资源占用
- Webhook 集成：agent 事件推送至 Slack / 飞书等平台

---

## 快速开始

### 1. 安装 CLI

```bash
npm install -g happy-coder
```

### 2. 启动守护进程

```bash
happy daemon start
```

### 3. 运行 agent

```bash
# 启动 Claude Code
happy

# 启动 Codex
happy codex
```

### 4. 手机连接

在 iOS / Android 应用的 Profile 设置中开启 **Spawn Sessions in Tmux**，即可在手机上监控和操作 agent。

---

## 典型工作流

```text
┌─ 开发者桌面 ──────────────────────────────────┐
│                                                │
│  $ happy daemon start                          │
│  $ happy            ← 启动 Claude Code agent   │
│  $ happy codex      ← 启动 Codex agent         │
│                                                │
│  tmux 自动为每个 agent 分配独立窗口              │
│  桌面随时 attach 查看任意 agent                  │
└────────────────────────────────────────────────┘
         │  端到端加密同步
         ▼
┌─ 手机端 ──────────────────────────────────────┐
│                                                │
│  实时查看 agent 输出                            │
│  收到推送 → 授权文件写入 / 命令执行              │
│  按任意键 → 控制权回到桌面                       │
└────────────────────────────────────────────────┘
```

---

## 项目组件

- **[Happy App](https://github.com/slopus/happy/tree/main/packages/happy-app)** — Web UI + 移动客户端 (Expo)
- **[Happy CLI](https://github.com/slopus/happy/tree/main/packages/happy-cli)** — 命令行界面
- **[Happy Server](https://github.com/slopus/happy/tree/main/packages/happy-server)** — 加密同步后端

## 文档与贡献

- [在线文档](https://happy.engineering/docs/)
- [CONTRIBUTING.md](CONTRIBUTING.md) — 开发环境搭建
- [帮助改进文档](https://github.com/slopus/slopus.github.io)

## License

MIT License — 详见 [LICENSE](LICENSE)。
