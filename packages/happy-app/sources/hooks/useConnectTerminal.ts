import * as React from 'react';
import { Platform } from 'react-native';
import { CameraView } from 'expo-camera';
import { useAuth } from '@/auth/AuthContext';
import { decodeBase64 } from '@/encryption/base64';
import { encryptBox } from '@/encryption/libsodium';
import { authApprove } from '@/auth/authApprove';
import { authGetToken } from '@/auth/authGetToken';
import { useCheckScannerPermissions } from '@/hooks/useCheckCameraPermissions';
import { Modal } from '@/modal';
import { t } from '@/text';
import { sync } from '@/sync/sync';
import { getServerUrl } from '@/sync/serverConfig';
import { TokenStorage } from '@/auth/tokenStorage';
import { registerServer } from '@/sync/serverRegistry';

interface UseConnectTerminalOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

/**
 * Parse a happy:// terminal URL.
 * New format: happy://terminal?key=<base64url>&server=<encodedUrl>
 * Old format: happy://terminal?<base64url>
 */
export function parseTerminalUrl(url: string): { publicKey: string; serverUrl: string | null } | null {
    if (!url.startsWith('happy://terminal?')) return null;
    const tail = url.slice('happy://terminal?'.length);

    // New format: has key= parameter
    if (tail.startsWith('key=')) {
        const params = new URLSearchParams(tail);
        const key = params.get('key');
        if (!key) return null;
        const server = params.get('server');
        return { publicKey: key, serverUrl: server ? decodeURIComponent(server) : null };
    }

    // Old format: entire tail is the base64url public key
    return { publicKey: tail, serverUrl: null };
}

export function useConnectTerminal(options?: UseConnectTerminalOptions) {
    const auth = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);
    const checkScannerPermissions = useCheckScannerPermissions();

    const processAuthUrl = React.useCallback(async (url: string) => {
        const parsed = parseTerminalUrl(url);
        if (!parsed) {
            Modal.alert(t('common.error'), t('modals.invalidAuthUrl'), [{ text: t('common.ok') }]);
            return false;
        }

        setIsLoading(true);
        try {
            const { publicKey: keyStr, serverUrl: targetServerUrl } = parsed;
            const publicKey = decodeBase64(keyStr, 'base64url');
            const activeServerUrl = getServerUrl();
            const effectiveServerUrl = targetServerUrl || activeServerUrl;

            // Determine which token to use
            let token = auth.credentials!.token;

            // Cross-server: if target server differs from active, get a JWT for the target
            if (targetServerUrl && targetServerUrl !== activeServerUrl) {
                const secret = decodeBase64(auth.credentials!.secret, 'base64url');
                token = await authGetToken(secret, targetServerUrl);

                // Store credentials for the new server
                await TokenStorage.setCredentials({ token, secret: auth.credentials!.secret }, targetServerUrl);

                // Register the new server and establish connection
                if (!sync.hasConnection(targetServerUrl)) {
                    registerServer(targetServerUrl);
                    await sync.addServer(targetServerUrl, { token, secret: auth.credentials!.secret });
                }
            }

            // Build encrypted responses
            const responseV1 = encryptBox(decodeBase64(auth.credentials!.secret, 'base64url'), publicKey);
            let responseV2Bundle = new Uint8Array(sync.encryption.contentDataKey.length + 1);
            responseV2Bundle[0] = 0;
            responseV2Bundle.set(sync.encryption.contentDataKey, 1);
            const responseV2 = encryptBox(responseV2Bundle, publicKey);

            // Send approval to the correct server
            await authApprove(token, publicKey, responseV1, responseV2, effectiveServerUrl);

            Modal.alert(t('common.success'), t('modals.terminalConnectedSuccessfully'), [
                {
                    text: t('common.ok'),
                    onPress: () => options?.onSuccess?.()
                }
            ]);
            return true;
        } catch (e) {
            console.error(e);
            Modal.alert(t('common.error'), t('modals.failedToConnectTerminal'), [{ text: t('common.ok') }]);
            options?.onError?.(e);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [auth.credentials, options]);

    const connectTerminal = React.useCallback(async () => {
        if (await checkScannerPermissions()) {
            CameraView.launchScanner({
                barcodeTypes: ['qr']
            });
        } else {
            Modal.alert(t('common.error'), t('modals.cameraPermissionsRequiredToConnectTerminal'), [{ text: t('common.ok') }]);
        }
    }, [checkScannerPermissions]);

    const connectWithUrl = React.useCallback(async (url: string) => {
        return await processAuthUrl(url);
    }, [processAuthUrl]);

    // Set up barcode scanner listener
    React.useEffect(() => {
        if (CameraView.isModernBarcodeScannerAvailable) {
            const subscription = CameraView.onModernBarcodeScanned(async (event) => {
                if (event.data.startsWith('happy://terminal?')) {
                    if (Platform.OS === 'ios') {
                        await CameraView.dismissScanner();
                    }
                    await processAuthUrl(event.data);
                }
            });
            return () => {
                subscription.remove();
            };
        }
    }, [processAuthUrl]);

    return {
        connectTerminal,
        connectWithUrl,
        isLoading,
        processAuthUrl
    };
}
