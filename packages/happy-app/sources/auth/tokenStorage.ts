import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_KEY = 'auth_credentials';

// Cache for synchronous access
let credentialsCache: string | null = null;

export interface AuthCredentials {
    token: string;
    secret: string;
}

function serverKey(serverUrl: string): string {
    // Simple hash: use a short deterministic key from the URL
    let hash = 0;
    for (let i = 0; i < serverUrl.length; i++) {
        const char = serverUrl.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return `auth_credentials_${Math.abs(hash).toString(36)}`;
}

export const TokenStorage = {
    async getCredentials(serverUrl?: string): Promise<AuthCredentials | null> {
        const key = serverUrl ? serverKey(serverUrl) : AUTH_KEY;
        if (Platform.OS === 'web') {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) as AuthCredentials : null;
        }
        try {
            const stored = await SecureStore.getItemAsync(key);
            if (!stored) return null;
            if (!serverUrl) credentialsCache = stored;
            return JSON.parse(stored) as AuthCredentials;
        } catch (error) {
            console.error('Error getting credentials:', error);
            return null;
        }
    },

    async setCredentials(credentials: AuthCredentials, serverUrl?: string): Promise<boolean> {
        const key = serverUrl ? serverKey(serverUrl) : AUTH_KEY;
        if (Platform.OS === 'web') {
            localStorage.setItem(key, JSON.stringify(credentials));
            return true;
        }
        try {
            const json = JSON.stringify(credentials);
            await SecureStore.setItemAsync(key, json);
            if (!serverUrl) credentialsCache = json;
            return true;
        } catch (error) {
            console.error('Error setting credentials:', error);
            return false;
        }
    },

    async removeCredentials(serverUrl?: string): Promise<boolean> {
        const key = serverUrl ? serverKey(serverUrl) : AUTH_KEY;
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return true;
        }
        try {
            await SecureStore.deleteItemAsync(key);
            if (!serverUrl) credentialsCache = null;
            return true;
        } catch (error) {
            console.error('Error removing credentials:', error);
            return false;
        }
    },
};
