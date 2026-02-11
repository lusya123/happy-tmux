import { MMKV } from 'react-native-mmkv';

const registryStorage = new MMKV({ id: 'server-registry' });

const SERVERS_KEY = 'registered-servers';
const ACTIVE_SERVER_KEY = 'active-server-url';

export interface ServerEntry {
    url: string;
    label?: string;
    addedAt: number;
    lastUsedAt: number;
}

export function getRegisteredServers(): ServerEntry[] {
    const raw = registryStorage.getString(SERVERS_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as ServerEntry[];
    } catch {
        return [];
    }
}

export function registerServer(url: string, label?: string): void {
    const servers = getRegisteredServers();
    const existing = servers.find(s => s.url === url);
    if (existing) {
        existing.lastUsedAt = Date.now();
        if (label) existing.label = label;
    } else {
        servers.push({ url, label, addedAt: Date.now(), lastUsedAt: Date.now() });
    }
    registryStorage.set(SERVERS_KEY, JSON.stringify(servers));
}

export function removeServer(url: string): void {
    const servers = getRegisteredServers().filter(s => s.url !== url);
    registryStorage.set(SERVERS_KEY, JSON.stringify(servers));
    // If removed server was active, clear active
    if (getActiveServerUrl() === url) {
        registryStorage.delete(ACTIVE_SERVER_KEY);
    }
}

export function updateServerLabel(url: string, label: string): void {
    const servers = getRegisteredServers();
    const server = servers.find(s => s.url === url);
    if (server) {
        server.label = label;
        registryStorage.set(SERVERS_KEY, JSON.stringify(servers));
    }
}

export function getActiveServerUrl(): string | null {
    return registryStorage.getString(ACTIVE_SERVER_KEY) || null;
}

export function setActiveServerUrl(url: string): void {
    registryStorage.set(ACTIVE_SERVER_KEY, url);
}

export function getServerLabel(url: string): string | undefined {
    const servers = getRegisteredServers();
    return servers.find(s => s.url === url)?.label;
}

export function getServerHostname(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}
