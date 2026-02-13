<div align="center"><img src="/.github/logotype-dark.png" width="400" title="Happy Coder" alt="Happy Coder"/></div>

<h1 align="center">
  Multi-Server Control Platform for Claude Code & Codex
</h1>

<h4 align="center">
Manage multiple AI coding agents across all your machines from anywhere, with end-to-end encryption.
</h4>

<div align="center">
  
[📱 **iOS App**](https://apps.apple.com/us/app/happy-claude-code-client/id6748571505) • [🤖 **Android App**](https://play.google.com/store/apps/details?id=com.ex3ndr.happy) • [🌐 **Web App**](https://app.happy.engineering) • [🎥 **See a Demo**](https://youtu.be/GCS0OG9QMSE) • [📚 **Documentation**](https://happy.engineering/docs/) • [💬 **Discord**](https://discord.gg/fX9WBAhyfD)

</div>

<img width="5178" height="2364" alt="github" src="/.github/header.png" />


<h3 align="center">
Step 1: Download App
</h3>

<div align="center">
<a href="https://apps.apple.com/us/app/happy-claude-code-client/id6748571505"><img width="135" height="39" alt="appstore" src="https://github.com/user-attachments/assets/45e31a11-cf6b-40a2-a083-6dc8d1f01291" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://play.google.com/store/apps/details?id=com.ex3ndr.happy"><img width="135" height="39" alt="googleplay" src="https://github.com/user-attachments/assets/acbba639-858f-4c74-85c7-92a4096efbf5" /></a>
</div>

<h3 align="center">
Step 2: Install CLI on your computer
</h3>

```bash
npm install -g happy-coder
```

<h3 align="center">
Step 3: Connect all your machines
</h3>

```bash
# On your local machine
happy

# On your cloud server
happy

# On your remote workstation
happy

# All sessions appear in one unified interface
# Scan QR codes to add each machine
```

<div align="center"><img src="/.github/mascot.png" width="200" title="Happy Coder" alt="Happy Coder"/></div>

## How does it work?

Happy Coder acts as a unified control center for all your AI coding agents across multiple machines. Run `happy` on any computer (local dev machine, cloud server, remote workstation), and all sessions appear in one unified interface on your mobile device or web browser.

**Multi-Server Architecture:**
- Connect to unlimited servers simultaneously (local + cloud + remote)
- All sessions and machines unified in a single view
- Seamlessly switch between environments
- Add new servers by scanning QR codes
- Independent connection management per server

When you want to control a session from your phone, it switches to remote mode. Press any key on your keyboard to switch back to local control.

## Tmux (Optional)

For remote sessions spawned by the Happy daemon, you can run sessions inside `tmux` windows:

1. Start daemon: `happy daemon start`
2. In app profile settings, enable **Spawn Sessions in Tmux**
3. Sessions will automatically use the `happy` tmux session (created if it doesn't exist)
4. Optionally customize with profile env vars: `TMUX_SESSION_NAME`, `TMUX_TMPDIR`

Detailed CLI docs: `packages/happy-cli/README.md`

## 🔥 Why Happy Coder?

- 🌐 **Multi-server unified control** - Manage AI agents across all your machines (local, cloud, remote) in one interface
- 📱 **Access from anywhere** - Control your coding agents from mobile, web, or desktop
- ⚡ **Seamless environment switching** - Jump between dev, staging, and production servers instantly
- 🔔 **Smart notifications** - Get alerted when any agent needs permission or encounters errors
- 🔐 **End-to-end encrypted** - Your code never leaves your devices unencrypted
- 🛠️ **Open source** - Audit the code yourself. No telemetry, no tracking

## 📦 Architecture

Happy Coder is a distributed control platform with three components:

- **[Happy App](https://github.com/slopus/happy/tree/main/packages/happy-app)** - Unified control interface (iOS, Android, Web, macOS)
- **[Happy CLI](https://github.com/slopus/happy/tree/main/packages/happy-cli)** - Agent wrapper installed on each machine
- **[Happy Server](https://github.com/slopus/happy/tree/main/packages/happy-server)** - Encrypted sync and coordination layer

```
┌─────────────────────────────────────────────────────────┐
│                    Happy App                            │
│            (Unified Control Interface)                  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ (encrypted WebSocket)
                          │
┌─────────────────────────────────────────────────────────┐
│                   Happy Server                          │
│              (Sync & Coordination)                      │
└─────────────────────────────────────────────────────────┘
          │                │                │
          │                │                │
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │Local Dev│      │  Cloud  │      │ Remote  │
    │ Machine │      │ Server  │      │Workstatn│
    │         │      │         │      │         │
    │happy CLI│      │happy CLI│      │happy CLI│
    │    ↓    │      │    ↓    │      │    ↓    │
    │ Claude  │      │ Claude  │      │ Claude  │
    └─────────┘      └─────────┘      └─────────┘
```

## 🏠 Who We Are

We're engineers managing AI coding agents across multiple environments - local dev machines, cloud servers, and remote workstations. Happy Coder was born from the frustration of juggling multiple terminal sessions and losing track of which AI agent was working on what, where. We needed a unified control center to manage all our coding agents from anywhere. We believe the best tools come from scratching your own itch and sharing with the community.

## 📚 Documentation & Contributing

- **[Documentation Website](https://happy.engineering/docs/)** - Learn how to use Happy Coder effectively
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development setup including iOS, Android, and macOS desktop variant builds
- **[Edit docs at github.com/slopus/slopus.github.io](https://github.com/slopus/slopus.github.io)** - Help improve our documentation and guides

## License

MIT License - see [LICENSE](LICENSE) for details.
