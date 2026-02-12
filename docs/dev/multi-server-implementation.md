# Multi-Server Concurrent Connection Implementation Guide

## Problem Statement

The happy-app (mobile) can only connect to one server at a time. When a user scans a QR code from a CLI on a different server, the auth approval is sent to the wrong server. The user wants to simultaneously connect to multiple servers (e.g., local computer + cloud server) and see all sessions/machines in a unified list.

## Root Cause

1. **QR code format** `happy://terminal?<publicKey>` does NOT include the server URL
2. **App sends auth approval to its own configured server**, not the CLI's server
3. **App architecture is single-server**: one WebSocket, one credential set, one encryption context

## Architecture Overview

### Current Architecture (Single Server)

```
Phone App (singleton instances)
├── serverConfig.ts    → single server URL (MMKV)
├── tokenStorage.ts    → single {token, secret} (SecureStore)
├── apiSocket.ts       → single WebSocket connection (singleton)
├── encryption.ts      → single Encryption instance
├── sync.ts            → single Sync instance (coordinates everything)
└── storage.ts         → single Zustand store (sessions, machines, etc.)
```

### Target Architecture (Multi Server)

```
Phone App
├── serverRegistry.ts  → multiple server entries (MMKV)
├── tokenStorage.ts    → per-server {token, secret} (SecureStore)
├── sync.ts (coordinator)
│   ├── ServerConnection[server-A]
│   │   ├── ApiSocket instance
│   │   ├── Encryption instance
│   │   ├── InvalidateSync instances
│   │   └── data key maps
│   └── ServerConnection[server-B]
│       ├── ApiSocket instance
│       ├── Encryption instance
│       ├── InvalidateSync instances
│       └── data key maps
└── storage.ts → unified store (sessions/machines tagged with serverUrl)
```

## Key Discovery: Limited Blast Radius

- `apiSocket` is only directly imported by **3 files**: `sync.ts`, `ops.ts`, `profileSync.ts`
- `sync` singleton is imported by **22 files**, but all through high-level methods
- Therefore: keep `sync` as the external API, refactor internals to manage multiple connections
- The 22 consumer files mostly DON'T need changes

## Critical Files Reference

### CLI (2 files to modify)

#### `packages/happy-cli/src/ui/auth.ts`
- **Line 98**: QR code URL construction
- Current: `'happy://terminal?' + encodeBase64Url(keypair.publicKey)`
- Change to: `` `happy://terminal?key=${encodeBase64Url(keypair.publicKey)}&server=${encodeURIComponent(configuration.serverUrl)}` ``
- Server URL comes from `configuration.serverUrl` (imported from `@/configuration`)

#### `packages/happy-cli/src/api/webAuth.ts`
- **Line 11**: Web auth URL construction
- Current: `` `${configuration.webappUrl}/terminal/connect#key=${publicKeyBase64}` ``
- Change to: `` `${configuration.webappUrl}/terminal/connect#key=${publicKeyBase64}&server=${encodeURIComponent(configuration.serverUrl)}` ``

### App - Auth (3 files to modify)

#### `packages/happy-app/sources/auth/tokenStorage.ts`
- Currently stores single credential under key `auth_credentials`
- Uses `expo-secure-store` on native, `localStorage` on web
- Has in-memory cache `credentialsCache`
- **Change**: Store per-server credentials using key `auth_credentials_<sha256(serverUrl)>`
- Add `serverUrl?` parameter to `getCredentials()`, `setCredentials()`, `removeCredentials()`
- Add `getAllCredentials(): Promise<Map<string, AuthCredentials>>`

#### `packages/happy-app/sources/auth/authApprove.ts`
- **Line 12**: Uses `getServerUrl()` for API endpoint
- **Change**: Add optional `serverUrl` parameter
- Both the status check (GET) and response (POST) need to use the target server URL
- The POST requires `Authorization: Bearer ${token}` — token must be valid for the target server

#### `packages/happy-app/sources/auth/authGetToken.ts`
- **Line 7**: Uses `getServerUrl()` for API endpoint
- Does challenge-response auth: signs random challenge with keypair derived from master secret
- **Change**: Add optional `serverUrl` parameter
- This is critical for cross-server auth: master secret is universal, can get JWT from any server

### App - Sync Core (6 files to modify/create)

#### `packages/happy-app/sources/sync/serverRegistry.ts` (NEW)
- Use MMKV (`id: 'server-registry'`) for persistence across logouts
- Store `ServerEntry[]`: `{ url, label?, addedAt, lastUsedAt }`
- Functions: `getRegisteredServers()`, `registerServer()`, `removeServer()`
- `getActiveServerUrl()` — returns "primary" server URL (for settings, profile, etc.)
- `setActiveServerUrl(url)` — set primary server
- Default server auto-registered on first use

#### `packages/happy-app/sources/sync/serverConnection.ts` (NEW)
- Encapsulates a single server's connection context
- Holds: `ApiSocket`, `Encryption`, `AuthCredentials`, `InvalidateSync` instances, data key maps
- Methods: `connect()`, `disconnect()`, `fetchSessions()`, `fetchMachines()`
- Writes fetched data to global storage with `serverUrl` tag
- Subscribes to WebSocket updates and routes them to storage

#### `packages/happy-app/sources/sync/sync.ts` (MAJOR REFACTOR)
- **~2100 lines**, the core of the app
- Currently: single-server logic with singleton `apiSocket`
- **Change**: Extract per-server logic into `ServerConnection`, keep Sync as coordinator
- Key new internal state: `connections = new Map<string, ServerConnection>()`
- Key new methods:
  - `addServer(serverUrl, credentials)` / `removeServer(serverUrl)`
  - `hasConnection(serverUrl): boolean`
  - `getConnectionForSession(sessionId): ServerConnection`
  - `getConnectionForMachine(machineId): ServerConnection`
  - `getSocketForMachine(machineId): ApiSocket` (for ops.ts)
  - `getSocketForSession(sessionId): ApiSocket` (for ops.ts)
- Existing methods keep same signatures, route internally:
  - `sendMessage(sessionId, ...)` → find connection by sessionId → use that connection's socket
  - `refreshSessions()` → invalidate all connections' sessionsSync
- Settings, profile, purchases: only sync from primary server
- Sessions, machines: sync from ALL servers and merge

#### `packages/happy-app/sources/sync/storageTypes.ts`
- **Line 51**: `Session` interface — add `serverUrl: string`
- **Line 118**: `Machine` interface — add `serverUrl: string`

#### `packages/happy-app/sources/sync/storage.ts`
- `applySessions(sessions, serverUrl)` — only replace sessions from THIS server
- `applyMachines(machines, serverUrl)` — same
- `removeSessions(serverUrl)` / `removeMachines(serverUrl)` — for server disconnect
- `socketStatuses: Record<string, SocketStatus>` — per-server connection status
- `setSocketStatus(serverUrl, status)` — update specific server's status

#### `packages/happy-app/sources/sync/serverConfig.ts`
- `getServerUrl()` delegates to `getActiveServerUrl()` from serverRegistry
- This ensures all 17 existing callers of `getServerUrl()` continue to work

### App - Socket Consumers (2 files to modify)

#### `packages/happy-app/sources/sync/ops.ts`
- **Line 6**: `import { apiSocket } from './apiSocket'`
- **Change**: Import `sync` instead, use `sync.getSocketForMachine(machineId)` for machine RPCs
- All functions that call `apiSocket.machineRPC()` or `apiSocket.sessionRPC()` need updating

#### `packages/happy-app/sources/sync/profileSync.ts`
- **Line 11**: `import { apiSocket } from './apiSocket'`
- **Change**: Route through `sync` to get the correct socket (primary server)

### App - QR Scanning (2 files to modify)

#### `packages/happy-app/sources/hooks/useConnectTerminal.ts`
- **Lines 23-54**: `processAuthUrl` function
- **Change**: Parse new URL format (extract `key` and `server` params)
- Backward compatible: if no `server` param, use active server
- Cross-server flow:
  1. Parse `serverUrl` from QR code
  2. If different server: call `authGetToken(masterSecret, serverUrl)` to get JWT
  3. Call `authApprove(token, publicKey, v1, v2, serverUrl)` to approve on target server
  4. If new server: register it, store credentials, call `sync.addServer()`

#### `packages/happy-app/sources/app/(app)/terminal/index.tsx`
- **Lines 21-30**: Parse search params
- **Change**: Handle new URL format with `key` and `server` params
- Show target server info in confirmation UI
- Show "connecting to new server: xxx" if it's a new server

### App - UI (4 files to modify)

#### `packages/happy-app/sources/app/(app)/new/pick/machine.tsx`
- Machine list already uses `useAllMachines()` which returns all machines from storage
- With `serverUrl` field on Machine, machines from all servers will appear automatically
- **Change**: Show server identifier (hostname) as subtitle or badge on each machine

#### `packages/happy-app/sources/app/(app)/server.tsx`
- Currently: single server URL configuration page
- **Change**: Server list page showing all connected servers
- Each server shows: URL, label, connection status (online/offline)
- Tap to edit label, swipe to disconnect/delete
- "Add Server" button at bottom

#### `packages/happy-app/sources/components/MainView.tsx`
- **Change**: Show aggregate connection status in header (e.g., "2/3 servers connected")
- Server icon always visible when multiple servers registered

#### `packages/happy-app/sources/components/SettingsView.tsx`
- **Change**: Server icon button always visible with multiple servers
- Machines list shows server identifier

### App - Init Flow (1 file to modify)

#### `packages/happy-app/sources/app/_layout.tsx`
- **Change**: On startup, load all registered servers and their credentials
- Call `sync.addServer()` for each server to establish all connections

## Cross-Server Authentication Flow (Critical)

The master secret is universal — it can authenticate with any server via challenge-response.

```
1. App has master secret (from initial login on Server A)
2. User scans QR code from CLI on Server B
3. App parses QR: extracts publicKey + serverUrl (Server B)
4. App calls authGetToken(masterSecret, serverB_url) → gets JWT for Server B
5. App calls authApprove(jwt_B, publicKey, v1, v2, serverB_url) → approval sent to Server B
6. CLI on Server B polls, receives approval, decrypts master secret
7. App registers Server B, stores credentials, calls sync.addServer(serverB_url, credentials)
8. WebSocket connection established to Server B
9. Sessions and machines from Server B appear in unified list
```

## Implementation Order

### Phase 1 — Infrastructure (Steps 1-4)
1. CLI QR code format change
2. ServerRegistry (new file)
3. TokenStorage multi-server support
4. ServerConnection class (new file)

### Phase 2 — Core Refactor (Steps 5-7)
5. Sync class refactor to multi-server coordinator
6. Storage types and methods
7. ops.ts / profileSync.ts socket routing

### Phase 3 — Integration (Steps 8-9)
8. QR code parsing and auth routing
9. Terminal connection page

### Phase 4 — UI (Steps 10-13)
10. Machine Picker multi-server display
11. Server management page
12. Header and Settings updates
13. Init flow

## Backward Compatibility

- Old CLI QR codes (no `server` param): App falls back to active server, same as current behavior
- Single-server users: Default server auto-registered, no behavior change
- No server-side changes needed

## Verification

1. Single server: new CLI + new App → scan → connect → works
2. Multi server: local CLI (A) + cloud CLI (B) → App scans both → both connected
3. Unified list: sessions from both servers visible
4. Cross-server spawn: select machine from different server → create session → works
5. Independent status: disconnect one server → other unaffected
6. Backward compat: old CLI QR → new App → works
7. Persistence: kill App → restart → auto-reconnect all servers
8. Type check: `yarn typecheck` passes
