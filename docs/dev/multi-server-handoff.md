# Multi-Server Implementation — Handoff Document

## Status: CODE COMPLETE — Awaiting Manual Testing

All code, i18n, unit tests, and commit are done. Next step is manual testing on Mac.

## What Was Done

### Phase 1 — Infrastructure (COMPLETE)
1. **CLI QR code format** — `packages/happy-cli/src/ui/auth.ts` line 98 and `packages/happy-cli/src/api/webAuth.ts` line 11 now include `&server=` parameter in URLs
2. **ServerRegistry** — NEW file `packages/happy-app/sources/sync/serverRegistry.ts` — MMKV-based storage for multiple server entries
3. **TokenStorage** — `packages/happy-app/sources/auth/tokenStorage.ts` — now accepts optional `serverUrl` parameter for per-server credential storage using hash-based keys
4. **ServerConnection** — NEW file `packages/happy-app/sources/sync/serverConnection.ts` — encapsulates a single server's Socket.IO connection, encryption, and RPC methods

### Phase 2 — Core Refactor (COMPLETE)
5. **serverConfig.ts** — delegates `getServerUrl()` to serverRegistry's active server; added `hasMultipleServers()`, `getDefaultServerUrl()`
6. **storageTypes.ts** — added `serverUrl?: string` to both `Session` and `Machine` interfaces
7. **storage.ts** — `applySessions` and `applyMachines` now accept optional `serverUrl` param; added `socketStatuses` (per-server), `setServerSocketStatus()`, `removeServerData()`
8. **sync.ts** — added `connections` Map, `sessionServerMap`, `machineServerMap`; added public methods: `addServer()`, `removeServer()`, `hasConnection()`, `getConnectionForSession()`, `getConnectionForMachine()`, `getSocketForMachine()`, `getSocketForSession()`, `getAllConnections()`, `registerSessionServer()`, `registerMachineServer()`; `handleUpdate` now accepts `serverUrl` param; `applySessions` passes serverUrl; `fetchMachines` tags machines with primary server URL
9. **ops.ts** — replaced all direct `apiSocket` calls with routing through `getSocketForMachine()`/`getSocketForSession()` helpers that fall back to `apiSocket` for primary server
10. **profileSync.ts** — removed unused `apiSocket` import

### Phase 3 — Integration (COMPLETE)
11. **authGetToken.ts** — added optional `serverUrl` parameter
12. **authApprove.ts** — added optional `serverUrl` parameter
13. **useConnectTerminal.ts** — complete rewrite: added `parseTerminalUrl()` function (exported, handles both new and old URL formats); cross-server auth flow: gets JWT from target server, stores credentials, registers server, calls `sync.addServer()`
14. **terminal/index.tsx** — updated to parse new URL format (key + server params); shows target server hostname and "new server" notice when connecting to a different server

### Phase 4 — UI (COMPLETE)
15. **machine.tsx** — shows server hostname as subtitle when multiple servers connected
16. **server.tsx** — rewritten from single-server config to server list page with add/remove functionality
17. **MainView.tsx** — server icon button now shows when `hasMultipleServers()` is true (not just custom server)
18. **SettingsView.tsx** — machines list shows server hostname when multiple servers connected
19. **_layout.tsx** — init flow now registers primary server, loads all registered servers, and calls `sync.addServer()` for each additional server

### Phase 5 — i18n, Tests, Commit (COMPLETE)

#### i18n — All 9 languages DONE
- **en.ts, ru.ts, pl.ts** — done in previous session
- **es.ts, ca.ts, it.ts, pt.ts, ja.ts, zh-Hans.ts** — done in this session
- Keys added: `common.remove`, `terminal.targetServer`, `terminal.newServerNotice`, `server.servers`, `server.connectedServers`, `server.noServersRegistered`, `server.addServer`, `server.removeServer`, `server.removeServerConfirm`

#### Unit Tests — All DONE and PASSING
- `serverRegistry.test.ts` — 14 tests (register, remove, active server, labels, hostname extraction)
- `tokenStorage.test.ts` — 10 tests (per-server credentials, isolation, removal)
- `parseTerminalUrl.test.ts` — 8 tests (new/old URL format, invalid inputs, edge cases)

#### Test Results
- `packages/happy-app`: 21 test files passed, 431 tests passed
- `packages/happy-cli`: 26 test files passed, 280 tests passed

#### Git Commit — DONE
- Commit `63ee18d7` on branch `feature/multi-server`
- 33 files changed, +1253/-183 lines
- Not yet pushed to remote

---

## Files Changed (Modified)
- `packages/happy-cli/src/ui/auth.ts`
- `packages/happy-cli/src/api/webAuth.ts`
- `packages/happy-app/sources/auth/tokenStorage.ts`
- `packages/happy-app/sources/auth/authApprove.ts`
- `packages/happy-app/sources/auth/authGetToken.ts`
- `packages/happy-app/sources/sync/serverConfig.ts`
- `packages/happy-app/sources/sync/storageTypes.ts`
- `packages/happy-app/sources/sync/storage.ts`
- `packages/happy-app/sources/sync/sync.ts`
- `packages/happy-app/sources/sync/ops.ts`
- `packages/happy-app/sources/sync/profileSync.ts`
- `packages/happy-app/sources/hooks/useConnectTerminal.ts`
- `packages/happy-app/sources/app/(app)/terminal/index.tsx`
- `packages/happy-app/sources/app/(app)/new/pick/machine.tsx`
- `packages/happy-app/sources/app/(app)/server.tsx`
- `packages/happy-app/sources/components/MainView.tsx`
- `packages/happy-app/sources/components/SettingsView.tsx`
- `packages/happy-app/sources/app/_layout.tsx`
- `packages/happy-app/sources/text/translations/en.ts`
- `packages/happy-app/sources/text/translations/ru.ts`
- `packages/happy-app/sources/text/translations/pl.ts`
- `packages/happy-app/sources/text/translations/es.ts`
- `packages/happy-app/sources/text/translations/ca.ts`
- `packages/happy-app/sources/text/translations/it.ts`
- `packages/happy-app/sources/text/translations/pt.ts`
- `packages/happy-app/sources/text/translations/ja.ts`
- `packages/happy-app/sources/text/translations/zh-Hans.ts`

## Files Created (New)
- `packages/happy-app/sources/sync/serverRegistry.ts`
- `packages/happy-app/sources/sync/serverConnection.ts`
- `packages/happy-app/sources/sync/serverRegistry.test.ts`
- `packages/happy-app/sources/auth/tokenStorage.test.ts`
- `packages/happy-app/sources/hooks/parseTerminalUrl.test.ts`
- `docs/multi-server-handoff.md`

---

## Phase 6 — Manual Testing on Mac

### Prerequisites
- Two separate server instances running (or one default + one custom server)
- The `happy` CLI installed and updated to the version on this branch

### How to Run the App on Mac

**Option A: Tauri Desktop App (recommended for Mac)**
```bash
cd packages/happy-app
yarn tauri:dev
```
This launches the macOS desktop app with hot reload.

**Option B: Web Browser**
```bash
cd packages/happy-app
yarn web
```
Then open the URL shown in terminal (usually http://localhost:8081).

**Option C: iOS Simulator**
```bash
cd packages/happy-app
yarn ios
```

### Test Cases

#### Test 1: Single Server (Regression)
1. Launch the app, log in to your default server
2. Verify sessions and machines load normally
3. Verify terminal connection works (scan QR / open link)
4. Verify settings page shows server info
5. **Expected**: Everything works exactly as before

#### Test 2: Add a Second Server via QR
1. On the second server, run `happy` CLI to generate a terminal QR code
2. In the app, scan the QR code (or use the deep link `happy://terminal?key=...&server=...`)
3. **Expected**:
   - A notice appears: "This terminal is on a new server. Accepting will add this server to your connected servers."
   - After accepting, the terminal connects and works
   - The second server appears in Settings > Servers

#### Test 3: Server List Management
1. Go to Settings > Servers (or tap the server icon in the main view)
2. **Expected**:
   - Both servers are listed with their hostnames
   - Each server shows connection status
   - You can remove a server (with confirmation dialog)

#### Test 4: Multi-Server Sessions & Machines
1. With two servers connected, go to the sessions list
2. **Expected**:
   - Sessions from both servers appear
   - Machines from both servers appear
   - Each machine shows its server hostname as subtitle
3. Start a session on server A, then on server B
4. **Expected**: Both sessions work independently

#### Test 5: Server Removal
1. Remove the second server from Settings > Servers
2. **Expected**:
   - Confirmation dialog appears
   - After confirming, the server and its sessions/machines disappear
   - Credentials for that server are cleaned up
   - The app continues working with the remaining server

#### Test 6: App Restart Persistence
1. With two servers connected, close and reopen the app
2. **Expected**:
   - Both servers reconnect automatically
   - Sessions and machines from both servers reload

#### Test 7: Old QR Format Backward Compatibility
1. Use an older CLI that generates `happy://terminal?<base64key>` (no `key=` prefix)
2. **Expected**: The app connects to the default server as before

### Known Limitations
- Web platform is secondary — test primarily on Tauri or iOS
- The `happy` CLI on the second server must be version 0.14.2+ (includes `&server=` in QR URLs)
