import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock expo-secure-store
const mockSecureStore: Record<string, string> = {};
vi.mock('expo-secure-store', () => ({
    getItemAsync: vi.fn(async (key: string) => mockSecureStore[key] || null),
    setItemAsync: vi.fn(async (key: string, value: string) => { mockSecureStore[key] = value; }),
    deleteItemAsync: vi.fn(async (key: string) => { delete mockSecureStore[key]; }),
}));

// Mock Platform as non-web
vi.mock('react-native', () => ({
    Platform: { OS: 'ios' },
}));

import { TokenStorage } from './tokenStorage';

describe('TokenStorage', () => {
    beforeEach(() => {
        // Clear mock store
        for (const key of Object.keys(mockSecureStore)) {
            delete mockSecureStore[key];
        }
    });

    it('returns null when no credentials stored', async () => {
        const result = await TokenStorage.getCredentials();
        expect(result).toBeNull();
    });

    it('stores and retrieves default credentials', async () => {
        const creds = { token: 'tok123', secret: 'sec456' };
        await TokenStorage.setCredentials(creds);
        const result = await TokenStorage.getCredentials();
        expect(result).toEqual(creds);
    });

    it('stores and retrieves per-server credentials', async () => {
        const creds = { token: 'server-tok', secret: 'server-sec' };
        await TokenStorage.setCredentials(creds, 'https://server-a.com');
        const result = await TokenStorage.getCredentials('https://server-a.com');
        expect(result).toEqual(creds);
    });

    it('keeps per-server and default credentials separate', async () => {
        const defaultCreds = { token: 'default-tok', secret: 'default-sec' };
        const serverCreds = { token: 'server-tok', secret: 'server-sec' };

        await TokenStorage.setCredentials(defaultCreds);
        await TokenStorage.setCredentials(serverCreds, 'https://server-a.com');

        expect(await TokenStorage.getCredentials()).toEqual(defaultCreds);
        expect(await TokenStorage.getCredentials('https://server-a.com')).toEqual(serverCreds);
    });

    it('stores credentials for different servers independently', async () => {
        const credsA = { token: 'tok-a', secret: 'sec-a' };
        const credsB = { token: 'tok-b', secret: 'sec-b' };

        await TokenStorage.setCredentials(credsA, 'https://server-a.com');
        await TokenStorage.setCredentials(credsB, 'https://server-b.com');

        expect(await TokenStorage.getCredentials('https://server-a.com')).toEqual(credsA);
        expect(await TokenStorage.getCredentials('https://server-b.com')).toEqual(credsB);
    });

    it('removes default credentials', async () => {
        await TokenStorage.setCredentials({ token: 'tok', secret: 'sec' });
        await TokenStorage.removeCredentials();
        expect(await TokenStorage.getCredentials()).toBeNull();
    });

    it('removes per-server credentials', async () => {
        await TokenStorage.setCredentials({ token: 'tok', secret: 'sec' }, 'https://server-a.com');
        await TokenStorage.removeCredentials('https://server-a.com');
        expect(await TokenStorage.getCredentials('https://server-a.com')).toBeNull();
    });

    it('removing server credentials does not affect default', async () => {
        const defaultCreds = { token: 'def-tok', secret: 'def-sec' };
        await TokenStorage.setCredentials(defaultCreds);
        await TokenStorage.setCredentials({ token: 'srv-tok', secret: 'srv-sec' }, 'https://server-a.com');

        await TokenStorage.removeCredentials('https://server-a.com');
        expect(await TokenStorage.getCredentials()).toEqual(defaultCreds);
    });

    it('returns true on successful set', async () => {
        const result = await TokenStorage.setCredentials({ token: 'tok', secret: 'sec' });
        expect(result).toBe(true);
    });

    it('returns true on successful remove', async () => {
        const result = await TokenStorage.removeCredentials();
        expect(result).toBe(true);
    });
});
