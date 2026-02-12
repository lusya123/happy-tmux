# Happy Multi-Server Feature — Next Steps

## 当前状态

✅ **代码开发完成**
- 多服务器并发连接功能已实现（Phase 1-5）
- 所有单元测试通过（happy-app 431 tests, happy-cli 280 tests）
- `yarn typecheck` 通过
- PR #1 已创建：https://github.com/lusya123/happy-tmux/pull/1

✅ **已修复的 Bug**
- 新建会话时机器选择 chip 不可见问题（commit 9e5c3bab）
- 全平台"连接终端"UI 入口缺失问题（commit f7759de5）

---

## 待完成：手动测试验证

### 前置准备

在两台云服务器上以 daemon 模式启动 CLI（避免 SSH 断开导致进程终止）：

**Server A** (`root@43.134.124.4`):
```bash
cd /root/happy-tmux/packages/happy-cli
happy daemon start
# 或者如果 happy 命令不可用：
node bin/happy.mjs daemon start
```

**Server B** (`ubuntu@150.109.16.237`):
```bash
cd /home/ubuntu/happy-tmux/packages/happy-cli
happy daemon start
# 或者：
node bin/happy.mjs daemon start
```

验证 daemon 启动成功：
```bash
happy daemon status
```

### 测试清单

#### ✅ Test 1: 基础功能验证
- [x] `yarn typecheck` 通过
- [x] `vitest run` 通过（happy-app + happy-cli）
- [x] 启动桌面端 APP（`yarn tauri:dev`）
- [x] 空状态页显示 "Enter URL manually" 按钮
- [x] Settings 页显示 "Enter URL manually" 选项

#### ⚠️ Test 2: 单服务器连接（回归测试）
- [ ] Server A daemon 正常运行
- [ ] 在 APP 中通过 "Enter URL manually" 或扫码连接 Server A
- [ ] 验证终端连接成功并可正常交互
- [ ] Settings 中显示 Server A 的机器信息

#### ❌ Test 3: 多服务器并发连接
- [ ] Server B daemon 正常运行
- [ ] 在 APP 中连接 Server B（第二个服务器）
- [ ] 验证两个终端同时工作，互不干扰
- [ ] Settings > Servers 显示两个服务器及其 hostname
- [ ] 新建会话时，机器列表显示两台服务器的机器，并标注服务器来源

#### ❌ Test 4: 服务器管理
- [ ] 在 Settings > Servers 中查看服务器列表
- [ ] 删除其中一个服务器
- [ ] 确认弹出删除确认对话框
- [ ] 确认删除后：
  - 该服务器的 sessions 消失
  - 该服务器的 machines 消失
  - 该服务器的 credentials 被清理
  - 另一个服务器仍正常工作

#### ❌ Test 5: 持久化和重连
- [ ] 保持两个服务器连接状态
- [ ] 完全退出 APP（Cmd+Q）
- [ ] 重新启动 APP
- [ ] 验证两个服务器自动重连
- [ ] 验证 sessions 和 machines 正确恢复

#### ❌ Test 6: 边界情况
- [ ] 连接到新服务器时显示 "This terminal is on a new server" 提示
- [ ] 服务器离线时，APP 显示正确的离线状态
- [ ] 网络断开重连后，WebSocket 自动恢复

---

## 测试完成后

### 1. 更新 PR 状态
- [ ] 在 PR #1 中勾选所有已完成的 test plan 项
- [ ] 添加测试截图或录屏（可选）
- [ ] 标记 PR 为 "Ready for review"

### 2. 合并到 main
- [ ] Review PR 代码（如有其他开发者）
- [ ] Merge PR #1 到 main 分支
- [ ] 删除 feature/multi-server 分支（可选）

---

## 后续功能规划（可选）

完成多服务器功能后，可以考虑以下方向：

### 短期优化
- [ ] 服务器连接状态实时监控和通知
- [ ] 服务器别名/标签功能（方便区分多个服务器）
- [ ] 批量操作：一键停止某服务器的所有 sessions
- [ ] 服务器性能指标展示（CPU、内存、磁盘）

### 中期功能
- [ ] 服务器分组管理（开发/测试/生产环境）
- [ ] 跨服务器文件同步
- [ ] 服务器间会话迁移
- [ ] 多服务器负载均衡（自动选择最空闲的服务器）

### 长期愿景
- [ ] 服务器集群管理
- [ ] 分布式任务调度
- [ ] 多租户支持（团队协作）
- [ ] 云服务商集成（AWS/GCP/Azure 一键部署）

---

## 问题排查

### Daemon 启动失败
```bash
# 查看 daemon 日志
cat ~/.happy/logs/*.log

# 清理旧的 daemon 状态
happy doctor clean

# 重新启动
happy daemon start
```

### APP 连接失败
- 检查服务器防火墙是否开放必要端口
- 确认 daemon 进程正在运行：`happy daemon status`
- 查看 APP 日志（开发者工具 Console）

### 多服务器数据混乱
- 检查 `serverUrl` 字段是否正确存储在 sessions/machines 中
- 验证 `serverRegistry` 中的服务器列表
- 清空本地数据重新连接（Settings > Developer > Clear Data）

---

## 联系方式

- GitHub Issues: https://github.com/lusya123/happy-tmux/issues
- PR 讨论: https://github.com/lusya123/happy-tmux/pull/1
