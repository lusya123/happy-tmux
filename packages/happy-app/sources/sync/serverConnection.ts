import { io, Socket } from 'socket.io-client';
import { Encryption } from './encryption/encryption';
import { EncryptionCache } from './encryption/encryptionCache';
import { InvalidateSync } from '@/utils/sync';
import { AuthCredentials } from '@/auth/tokenStorage';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Encapsulates a single server's connection context:
 * ApiSocket + Encryption + InvalidateSync instances + data key maps
 */
export class ServerConnection {
    readonly serverUrl: string;
    readonly credentials: AuthCredentials;
    readonly encryption: Encryption;

    // Socket.IO connection
    private socket: Socket | null = null;
    private messageHandlers = new Map<string, (data: any) => void>();
    private reconnectedListeners = new Set<() => void>();
    private statusListeners = new Set<(status: ConnectionStatus) => void>();
    private _status: ConnectionStatus = 'disconnected';

    // Data key maps for this server
    readonly sessionDataKeys = new Map<string, Uint8Array>();
    readonly machineDataKeys = new Map<string, Uint8Array>();
    readonly artifactDataKeys = new Map<string, Uint8Array>();

    // Per-session message tracking
    readonly sessionReceivedMessages = new Map<string, Set<string>>();
    readonly messagesSync = new Map<string, InvalidateSync>();

    constructor(
        serverUrl: string,
        credentials: AuthCredentials,
        encryption: Encryption
    ) {
        this.serverUrl = serverUrl;
        this.credentials = credentials;
        this.encryption = encryption;
    }

    get status(): ConnectionStatus {
        return this._status;
    }

    connect(): void {
        if (this.socket) return;
        this.updateStatus('connecting');

        this.socket = io(this.serverUrl, {
            path: '/v1/updates',
            auth: {
                token: this.credentials.token,
                clientType: 'user-scoped' as const
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity
        });

        this.setupEventHandlers();
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        // Stop all message syncs
        for (const sync of this.messagesSync.values()) {
            sync.stop();
        }
        this.messagesSync.clear();
        this.updateStatus('disconnected');
    }

    onReconnected(listener: () => void): () => void {
        this.reconnectedListeners.add(listener);
        return () => this.reconnectedListeners.delete(listener);
    }

    onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.add(listener);
        listener(this._status);
        return () => this.statusListeners.delete(listener);
    }

    onMessage(event: string, handler: (data: any) => void): () => void {
        this.messageHandlers.set(event, handler);
        return () => this.messageHandlers.delete(event);
    }

    async sessionRPC<R, A>(sessionId: string, method: string, params: A): Promise<R> {
        const sessionEncryption = this.encryption.getSessionEncryption(sessionId);
        if (!sessionEncryption) {
            throw new Error(`Session encryption not found for ${sessionId}`);
        }
        const result = await this.socket!.emitWithAck('rpc-call', {
            method: `${sessionId}:${method}`,
            params: await sessionEncryption.encryptRaw(params)
        });
        if (result.ok) {
            return await sessionEncryption.decryptRaw(result.result) as R;
        }
        throw new Error('RPC call failed');
    }

    async machineRPC<R, A>(machineId: string, method: string, params: A): Promise<R> {
        const machineEncryption = this.encryption.getMachineEncryption(machineId);
        if (!machineEncryption) {
            throw new Error(`Machine encryption not found for ${machineId}`);
        }
        const result = await this.socket!.emitWithAck('rpc-call', {
            method: `${machineId}:${method}`,
            params: await machineEncryption.encryptRaw(params)
        });
        if (result.ok) {
            return await machineEncryption.decryptRaw(result.result) as R;
        }
        throw new Error('RPC call failed');
    }

    send(event: string, data: any): boolean {
        this.socket!.emit(event, data);
        return true;
    }

    async emitWithAck<T = any>(event: string, data: any): Promise<T> {
        if (!this.socket) throw new Error('Socket not connected');
        return await this.socket.emitWithAck(event, data);
    }

    async request(path: string, options?: RequestInit): Promise<Response> {
        const url = `${this.serverUrl}${path}`;
        const headers = {
            'Authorization': `Bearer ${this.credentials.token}`,
            ...options?.headers
        };
        return fetch(url, { ...options, headers });
    }

    updateToken(newToken: string): void {
        if (this.credentials.token !== newToken) {
            (this.credentials as any).token = newToken;
            if (this.socket) {
                this.disconnect();
                this.connect();
            }
        }
    }

    private updateStatus(status: ConnectionStatus): void {
        if (this._status !== status) {
            this._status = status;
            this.statusListeners.forEach(listener => listener(status));
        }
    }

    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.updateStatus('connected');
            if (!this.socket?.recovered) {
                this.reconnectedListeners.forEach(listener => listener());
            }
        });

        this.socket.on('disconnect', () => {
            this.updateStatus('disconnected');
        });

        this.socket.on('connect_error', () => {
            this.updateStatus('error');
        });

        this.socket.on('error', () => {
            this.updateStatus('error');
        });

        this.socket.onAny((event, data) => {
            const handler = this.messageHandlers.get(event);
            if (handler) handler(data);
        });
    }
}
