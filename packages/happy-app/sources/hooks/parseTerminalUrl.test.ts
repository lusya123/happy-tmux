import { describe, it, expect, vi } from 'vitest';

// Mock all heavy dependencies that useConnectTerminal imports
vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-camera', () => ({ CameraView: {} }));
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({}) }));
vi.mock('@/encryption/base64', () => ({ decodeBase64: vi.fn() }));
vi.mock('@/encryption/libsodium', () => ({ encryptBox: vi.fn() }));
vi.mock('@/auth/authApprove', () => ({ authApprove: vi.fn() }));
vi.mock('@/auth/authGetToken', () => ({ authGetToken: vi.fn() }));
vi.mock('@/hooks/useCheckCameraPermissions', () => ({ useCheckScannerPermissions: vi.fn() }));
vi.mock('@/modal', () => ({ Modal: { alert: vi.fn() } }));
vi.mock('@/text', () => ({ t: (key: string) => key }));
vi.mock('@/sync/sync', () => ({ sync: {} }));
vi.mock('@/sync/serverConfig', () => ({ getServerUrl: vi.fn() }));
vi.mock('@/auth/tokenStorage', () => ({ TokenStorage: {} }));
vi.mock('@/sync/serverRegistry', () => ({ registerServer: vi.fn() }));

import { parseTerminalUrl } from './useConnectTerminal';

describe('parseTerminalUrl', () => {
    it('parses new format with key and server params', () => {
        const url = 'happy://terminal?key=abc123&server=https%3A%2F%2Fmy-server.com';
        const result = parseTerminalUrl(url);
        expect(result).toEqual({
            publicKey: 'abc123',
            serverUrl: 'https://my-server.com',
        });
    });

    it('parses new format with key only (no server)', () => {
        const url = 'happy://terminal?key=abc123';
        const result = parseTerminalUrl(url);
        expect(result).toEqual({
            publicKey: 'abc123',
            serverUrl: null,
        });
    });

    it('parses old format (entire tail is publicKey)', () => {
        const url = 'happy://terminal?someBase64UrlKey_-abc';
        const result = parseTerminalUrl(url);
        expect(result).toEqual({
            publicKey: 'someBase64UrlKey_-abc',
            serverUrl: null,
        });
    });

    it('returns null for non-happy:// URL', () => {
        expect(parseTerminalUrl('https://example.com')).toBeNull();
    });

    it('returns null for happy:// URL without terminal path', () => {
        expect(parseTerminalUrl('happy://other?key=abc')).toBeNull();
    });

    it('returns null when key param is empty in new format', () => {
        const url = 'happy://terminal?key=&server=https%3A%2F%2Fmy-server.com';
        expect(parseTerminalUrl(url)).toBeNull();
    });

    it('handles server URL with port and path', () => {
        const url = 'happy://terminal?key=myKey123&server=https%3A%2F%2Fserver.com%3A8080%2Fapi';
        const result = parseTerminalUrl(url);
        expect(result).toEqual({
            publicKey: 'myKey123',
            serverUrl: 'https://server.com:8080/api',
        });
    });

    it('handles empty string', () => {
        expect(parseTerminalUrl('')).toBeNull();
    });
});
