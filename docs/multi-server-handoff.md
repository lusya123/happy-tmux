# Multi-Server Implementation — Handoff Document

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

### Phase 5 — i18n, Tests, Typecheck, Commit (PARTIALLY COMPLETE)

#### i18n — English DONE, 2 of 8 other languages done
- **en.ts** — DONE: added `common.remove`, `terminal.targetServer`, `terminal.newServerNotice`, `server.servers`, `server.connectedServers`, `server.noServersRegistered`, `server.addServer`, `server.removeServer`, `server.removeServerConfirm`
- **ru.ts** — DONE (by i18n agent)
- **pl.ts** — DONE (by i18n agent)
- **es.ts** — NOT DONE
- **ca.ts** — NOT DONE
- **it.ts** — NOT DONE
- **pt.ts** — NOT DONE
- **ja.ts** — NOT DONE
- **zh-Hans.ts** — NOT DONE

#### Tests — NOT DONE
- `serverRegistry.test.ts` — file created with 2 test cases, but incomplete (only has the first 2 tests, needs more)
- `tokenStorage.test.ts` — NOT CREATED
- QR URL parsing test — NOT CREATED

#### Typecheck — PARTIALLY DONE
- Ran `npx typescript tsc --noEmit` — no errors in our changed files (pre-existing errors in unrelated `-zen` module)
- Need to run `yarn test` in both packages to verify existing tests pass

#### Git Commit — NOT DONE

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

## Files Created (New)
- `packages/happy-app/sources/sync/serverRegistry.ts`
- `packages/happy-app/sources/sync/serverConnection.ts`
- `packages/happy-app/sources/sync/serverRegistry.test.ts` (incomplete)

## What Remains To Do

### 1. Complete i18n translations (6 language files)
Add these keys to es.ts, ca.ts, it.ts, pt.ts, ja.ts, zh-Hans.ts:
- `common.remove` — translate "Remove"
- `terminal.targetServer` — translate "Target Server"
- `terminal.newServerNotice` — translate "This terminal is on a new server. Accepting will add this server to your connected servers."
- `server.servers` — translate "Servers"
- `server.connectedServers` — translate "Connected Servers"
- `server.noServersRegistered` — translate "No servers registered"
- `server.addServer` — translate "Add Server"
- `server.removeServer` — translate "Remove Server"
- `server.removeServerConfirm` — translate "Are you sure you want to disconnect from this server? Sessions and machines from this server will be removed."

### 2. Complete unit tests
- **serverRegistry.test.ts** — complete the test file: test register, remove, getActive, setActive, updateLabel, getServerHostname, persistence
- **tokenStorage.test.ts** — create: test multi-server credential get/set/remove (mock SecureStore)
- **useConnectTerminal.test.ts** — create: test `parseTerminalUrl()` for new format (key+server), old format (just publicKey), and invalid URLs

### 3. Run existing tests
- `cd packages/happy-app && yarn test` — verify 11 existing tests pass
- `cd packages/happy-cli && yarn test` — verify 29 existing CLI tests pass

### 4. Run new tests
- Run the new test files and fix any failures

### 5. Git commit
- Stage all changed and new files
- Commit with English message describing the multi-server feature
