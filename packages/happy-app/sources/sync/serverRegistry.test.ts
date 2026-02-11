import { describe, it, expect, beforeEach, vi } from 'vitest';

// Use vi.hoisted so the mock object is available when vi.mock runs (hoisted above imports)
const { mockStorage, mockMMKV } = vi.hoisted(() => {
    const mockStorage = new Map<string, string>();
    const mockMMKV = {
        getString: (key: string) => mockStorage.get(key) || undefined,
        set: (key: string, value: string) => mockStorage.set(key, value),
        delete: (key: string) => mockStorage.delete(key),
    };
    return { mockStorage, mockMMKV };
});

vi.mock('react-native-mmkv', () => ({
    MMKV: class {
        constructor() {
            return mockMMKV;
        }
    }
}));

import {
    getRegisteredServers,
    registerServer,
    removeServer,
    getActiveServerUrl,
    setActiveServerUrl,
    updateServerLabel,
    getServerHostname,
} from './serverRegistry';

describe('serverRegistry', () => {
    beforeEach(() => {
        mockStorage.clear();
    });

    it('returns empty array when no servers registered', () => {
        expect(getRegisteredServers()).toEqual([]);
    });

    it('registers a new server', () => {
        registerServer('https://server-a.com');
        const servers = getRegisteredServers();
        expect(servers).toHaveLength(1);
        expect(servers[0].url).toBe('https://server-a.com');
        expect(servers[0].addedAt).toBeGreaterThan(0);
    });

    it('registers multiple servers', () => {
        registerServer('https://server-a.com');
        registerServer('https://server-b.com');
        registerServer('https://server-c.com');
        const servers = getRegisteredServers();
        expect(servers).toHaveLength(3);
        expect(servers.map(s => s.url)).toEqual([
            'https://server-a.com',
            'https://server-b.com',
            'https://server-c.com',
        ]);
    });

    it('updates lastUsedAt when registering an existing server', () => {
        registerServer('https://server-a.com');
        const before = getRegisteredServers()[0].lastUsedAt;
        registerServer('https://server-a.com');
        const servers = getRegisteredServers();
        expect(servers).toHaveLength(1);
        expect(servers[0].lastUsedAt).toBeGreaterThanOrEqual(before);
    });

    it('registers a server with a label', () => {
        registerServer('https://server-a.com', 'My Server');
        const servers = getRegisteredServers();
        expect(servers[0].label).toBe('My Server');
    });

    it('removes a server', () => {
        registerServer('https://server-a.com');
        registerServer('https://server-b.com');
        removeServer('https://server-a.com');
        const servers = getRegisteredServers();
        expect(servers).toHaveLength(1);
        expect(servers[0].url).toBe('https://server-b.com');
    });

    it('clears active server when removing the active one', () => {
        registerServer('https://server-a.com');
        setActiveServerUrl('https://server-a.com');
        expect(getActiveServerUrl()).toBe('https://server-a.com');
        removeServer('https://server-a.com');
        expect(getActiveServerUrl()).toBeNull();
    });

    it('does not clear active server when removing a different one', () => {
        registerServer('https://server-a.com');
        registerServer('https://server-b.com');
        setActiveServerUrl('https://server-a.com');
        removeServer('https://server-b.com');
        expect(getActiveServerUrl()).toBe('https://server-a.com');
    });

    it('returns null when no active server is set', () => {
        expect(getActiveServerUrl()).toBeNull();
    });

    it('sets and gets active server URL', () => {
        setActiveServerUrl('https://server-a.com');
        expect(getActiveServerUrl()).toBe('https://server-a.com');
    });

    it('updates server label', () => {
        registerServer('https://server-a.com', 'Old Label');
        updateServerLabel('https://server-a.com', 'New Label');
        const servers = getRegisteredServers();
        expect(servers[0].label).toBe('New Label');
    });

    it('does nothing when updating label for non-existent server', () => {
        registerServer('https://server-a.com');
        updateServerLabel('https://nonexistent.com', 'Label');
        const servers = getRegisteredServers();
        expect(servers).toHaveLength(1);
        expect(servers[0].label).toBeUndefined();
    });

    it('extracts hostname from URL', () => {
        expect(getServerHostname('https://my-server.example.com')).toBe('my-server.example.com');
        expect(getServerHostname('https://api.example.com:8080/path')).toBe('api.example.com');
    });

    it('returns raw string for invalid URL', () => {
        expect(getServerHostname('not-a-url')).toBe('not-a-url');
    });
});
