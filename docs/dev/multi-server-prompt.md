# Multi-Server Feature — Claude Code Session Prompt

下面是你在新的 Claude Code session 中使用的 prompt。复制粘贴即可。

---

## Prompt

```
请按以下顺序连续实施所有步骤（不要暂停）：

Phase 1 — 基础设施：
1. 修改 CLI QR 码格式（packages/happy-cli/src/ui/auth.ts line 98 和 packages/happy-cli/src/api/webAuth.ts line 11）— 在 URL 中加入 &server= 参数
2. 新建 ServerRegistry（packages/happy-app/sources/sync/serverRegistry.ts）— 用 MMKV 存储多服务器元数据
3. 修改 TokenStorage 支持多服务器（packages/happy-app/sources/auth/tokenStorage.ts）— 按服务器 URL hash 存储凭证
4. 新建 ServerConnection 类（packages/happy-app/sources/sync/serverConnection.ts）— 封装单服务器连接上下文（ApiSocket + Encryption + InvalidateSync）

Phase 2 — 核心重构：
5. 重构 Sync 类为多服务器协调器（packages/happy-app/sources/sync/sync.ts）— 内部维护 Map<string, ServerConnection>，对外 API 保持不变，通过 sessionId/machineId 路由到正确的 connection
6. 修改 Storage 类型（packages/happy-app/sources/sync/storageTypes.ts 给 Session 和 Machine 加 serverUrl 字段，packages/happy-app/sources/sync/storage.ts 支持按服务器合并/移除数据）
7. 修改 ops.ts 和 profileSync.ts — 将 apiSocket 直接导入改为通过 sync.getSocketForMachine()/getSocketForSession() 路由

Phase 3 — 集成：
8. 修改 QR 码解析和跨服务器认证 — useConnectTerminal.ts 解析新 URL 格式，authApprove.ts 和 authGetToken.ts 添加 serverUrl 参数。跨服务器认证关键：master secret 是通用的，扫新服务器 QR 码时先用 authGetToken(masterSecret, targetServerUrl) 获取该服务器的 JWT
9. 修改 terminal 连接页面（packages/happy-app/sources/app/(app)/terminal/index.tsx）— 支持新 URL 格式，显示目标服务器信息

Phase 4 — UI：
10. Machine Picker（packages/happy-app/sources/app/(app)/new/pick/machine.tsx）— 在机器列表中显示服务器标识
11. 服务器管理页面（packages/happy-app/sources/app/(app)/server.tsx）— 从单服务器配置改为服务器列表
12. Header 和 Settings 更新（MainView.tsx 显示聚合连接状态，SettingsView.tsx 多服务器时始终显示服务器图标）
13. 初始化流程（packages/happy-app/sources/app/_layout.tsx）— 启动时加载所有已注册服务器并建立连接

重要注意事项：
- 先阅读实现文档 docs/multi-server-implementation.md，它包含了完整的架构设计、每个文件的改动说明（含行号和代码示例）
- 先阅读每个要修改的文件的完整内容，理解现有代码后再修改
- 遵循项目的 CLAUDE.md 中的代码规范（严格类型、不要创建无意义的小函数、不要 backward compatibility hack、不要 backward compatibility shim）
- 所有用户可见字符串使用 t() 函数国际化，新增字符串需要添加到所有语言文件
- sync.ts 是核心文件（~2100行），重构时保持对外 API 签名不变，22 个消费者文件不应需要修改
- apiSocket 只被 3 个文件直接导入（sync.ts、ops.ts、profileSync.ts），这是改动范围的边界
- serverConfig.ts 的 getServerUrl() 委托给 serverRegistry.getActiveServerUrl()，这样现有 17 个调用者无需修改
- 向后兼容：旧版 CLI QR 码（无 server 参数）回退到当前活跃服务器

测试和验证（全部写完后执行）：
- 运行 yarn typecheck（在 packages/happy-app 目录下）确保类型安全，修复所有类型错误
- 运行 yarn test（在 packages/happy-app 目录下）确保现有 11 个测试不被破坏
- 运行 yarn test（在 packages/happy-cli 目录下）确保 CLI 的 29 个测试通过
- 为新增的纯逻辑编写单元测试（使用 vitest，测试文件放在对应源文件旁边，命名为 xxx.test.ts）：
  - serverRegistry.test.ts：测试服务器注册、删除、获取活跃服务器、持久化
  - tokenStorage.test.ts：测试多服务器凭证的存取和删除（mock SecureStore）
  - QR URL 解析逻辑的测试：测试新格式（含 key + server 参数）和旧格式（只有 publicKey）的解析
- 运行新写的测试确保全部通过
- 最后用 git 提交所有改动，commit message 用英文描述这个 feature
```
