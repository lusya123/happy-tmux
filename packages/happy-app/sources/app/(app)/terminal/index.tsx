import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/StyledText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '@/constants/Typography';
import { RoundButton } from '@/components/RoundButton';
import { useConnectTerminal, parseTerminalUrl } from '@/hooks/useConnectTerminal';
import { Ionicons } from '@expo/vector-icons';
import { ItemList } from '@/components/ItemList';
import { ItemGroup } from '@/components/ItemGroup';
import { Item } from '@/components/Item';
import { useUnistyles } from 'react-native-unistyles';
import { t } from '@/text';
import { getServerUrl } from '@/sync/serverConfig';
import { getServerHostname } from '@/sync/serverRegistry';

export default function TerminalScreen() {
    const router = useRouter();
    const searchParams = useLocalSearchParams();
    const { theme } = useUnistyles();

    // Parse URL params - support both new format (key + server) and old format
    const parsed = React.useMemo(() => {
        const keys = Object.keys(searchParams);
        if (keys.length === 0) return null;

        // Check for new format: key=...&server=...
        const keyParam = searchParams['key'] as string | undefined;
        const serverParam = searchParams['server'] as string | undefined;
        if (keyParam) {
            return {
                publicKey: keyParam,
                serverUrl: serverParam ? decodeURIComponent(serverParam) : null
            };
        }

        // Old format: first key is the public key
        return { publicKey: keys[0], serverUrl: null };
    }, [searchParams]);

    const { processAuthUrl, isLoading } = useConnectTerminal({
        onSuccess: () => {
            router.back();
        }
    });

    const handleConnect = async () => {
        if (!parsed) return;
        // Reconstruct the URL for processAuthUrl
        let authUrl: string;
        if (parsed.serverUrl) {
            authUrl = `happy://terminal?key=${parsed.publicKey}&server=${encodeURIComponent(parsed.serverUrl)}`;
        } else {
            authUrl = `happy://terminal?${parsed.publicKey}`;
        }
        await processAuthUrl(authUrl);
    };

    const handleReject = () => {
        router.back();
    };

    const activeServerUrl = getServerUrl();
    const isNewServer = parsed?.serverUrl ? parsed.serverUrl !== activeServerUrl : false;
    const targetHostname = parsed?.serverUrl ? getServerHostname(parsed.serverUrl) : null;

    // Show error if no key found
    if (!parsed) {
        return (
            <>
                <ItemList>
                    <ItemGroup>
                        <View style={{
                            alignItems: 'center',
                            paddingVertical: 32,
                            paddingHorizontal: 16
                        }}>
                            <Ionicons
                                name="warning-outline"
                                size={48}
                                color={theme.colors.textDestructive}
                                style={{ marginBottom: 16 }}
                            />
                            <Text style={{
                                ...Typography.default('semiBold'),
                                fontSize: 16,
                                color: theme.colors.textDestructive,
                                textAlign: 'center',
                                marginBottom: 8
                            }}>
                                {t('terminal.invalidConnectionLink')}
                            </Text>
                            <Text style={{
                                ...Typography.default(),
                                fontSize: 14,
                                color: theme.colors.textSecondary,
                                textAlign: 'center',
                                lineHeight: 20
                            }}>
                                {t('terminal.invalidConnectionLinkDescription')}
                            </Text>
                        </View>
                    </ItemGroup>
                </ItemList>
            </>
        );
    }

    // Show confirmation screen for valid connection
    return (
        <>
            <ItemList>
                {/* Connection Request Header */}
                <ItemGroup>
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 24,
                        paddingHorizontal: 16
                    }}>
                        <Ionicons
                            name="terminal-outline"
                            size={48}
                            color={theme.colors.radio.active}
                            style={{ marginBottom: 16 }}
                        />
                        <Text style={{
                            ...Typography.default('semiBold'),
                            fontSize: 20,
                            textAlign: 'center',
                            marginBottom: 12,
                            color: theme.colors.text
                        }}>
                            {t('terminal.connectTerminal')}
                        </Text>
                        <Text style={{
                            ...Typography.default(),
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            textAlign: 'center',
                            lineHeight: 20
                        }}>
                            {t('terminal.terminalRequestDescription')}
                        </Text>
                    </View>
                </ItemGroup>

                {/* Connection Details */}
                <ItemGroup title={t('terminal.connectionDetails')}>
                    <Item
                        title={t('terminal.publicKey')}
                        detail={`${parsed.publicKey.substring(0, 12)}...`}
                        icon={<Ionicons name="key-outline" size={29} color={theme.colors.radio.active} />}
                        showChevron={false}
                    />
                    {targetHostname && (
                        <Item
                            title={t('terminal.targetServer')}
                            detail={targetHostname}
                            icon={<Ionicons name="server-outline" size={29} color={isNewServer ? theme.colors.status.connecting : theme.colors.radio.active} />}
                            showChevron={false}
                        />
                    )}
                    <Item
                        title={t('terminal.encryption')}
                        detail={t('terminal.endToEndEncrypted')}
                        icon={<Ionicons name="lock-closed-outline" size={29} color={theme.colors.success} />}
                        showChevron={false}
                    />
                </ItemGroup>

                {/* New Server Notice */}
                {isNewServer && (
                    <ItemGroup>
                        <View style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12
                        }}>
                            <Text style={{
                                ...Typography.default(),
                                fontSize: 13,
                                color: theme.colors.status.connecting,
                                textAlign: 'center',
                                lineHeight: 18
                            }}>
                                {t('terminal.newServerNotice')}
                            </Text>
                        </View>
                    </ItemGroup>
                )}

                {/* Action Buttons */}
                <ItemGroup>
                    <View style={{
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        gap: 12
                    }}>
                        <RoundButton
                            title={isLoading ? t('terminal.connecting') : t('terminal.acceptConnection')}
                            onPress={handleConnect}
                            size="large"
                            disabled={isLoading}
                            loading={isLoading}
                        />
                        <RoundButton
                            title={t('terminal.reject')}
                            onPress={handleReject}
                            size="large"
                            display="inverted"
                            disabled={isLoading}
                        />
                    </View>
                </ItemGroup>

                {/* Security Notice */}
                <ItemGroup
                    title={t('terminal.security')}
                    footer={t('terminal.securityFooterDevice')}
                >
                    <Item
                        title={t('terminal.clientSideProcessing')}
                        subtitle={t('terminal.linkProcessedOnDevice')}
                        icon={<Ionicons name="shield-checkmark-outline" size={29} color={theme.colors.success} />}
                        showChevron={false}
                    />
                </ItemGroup>
            </ItemList>
        </>
    );
}
