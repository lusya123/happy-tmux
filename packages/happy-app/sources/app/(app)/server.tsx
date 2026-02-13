import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/StyledText';
import { Typography } from '@/constants/Typography';
import { ItemGroup } from '@/components/ItemGroup';
import { ItemList } from '@/components/ItemList';
import { Item } from '@/components/Item';
import { RoundButton } from '@/components/RoundButton';
import { Modal } from '@/modal';
import { layout } from '@/components/layout';
import { t } from '@/text';
import { getServerUrl, setServerUrl, validateServerUrl, getServerInfo } from '@/sync/serverConfig';
import { getRegisteredServers, removeServer, updateServerLabel, getServerHostname, ServerEntry } from '@/sync/serverRegistry';
import { useSocketStatus } from '@/sync/storage';
import { sync } from '@/sync/sync';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const stylesheet = StyleSheet.create((theme) => ({
    keyboardAvoidingView: {
        flex: 1,
    },
    itemListContainer: {
        flex: 1,
    },
    contentContainer: {
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
        maxWidth: layout.maxWidth,
        alignSelf: 'center',
    },
    labelText: {
        ...Typography.default('semiBold'),
        fontSize: 12,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: theme.colors.input.background,
        padding: 12,
        borderRadius: 8,
        ...Typography.mono(),
        fontSize: 14,
        color: theme.colors.input.text,
    },
    errorText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.textDestructive,
        marginBottom: 12,
    },
    validatingText: {
        ...Typography.default(),
        fontSize: 12,
        color: theme.colors.status.connecting,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    buttonWrapper: {
        flex: 1,
    },
}));

export default React.memo(function ServerConfigScreen() {
    const { theme } = useUnistyles();
    const styles = stylesheet;
    const router = useRouter();
    const socketStatus = useSocketStatus();
    const [servers, setServers] = useState(() => getRegisteredServers());
    const [inputUrl, setInputUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    const refreshServers = () => setServers(getRegisteredServers());

    const validateServer = async (url: string): Promise<boolean> => {
        try {
            setIsValidating(true);
            setError(null);
            const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'text/plain' } });
            if (!response.ok) {
                setError(t('server.serverReturnedError'));
                return false;
            }
            const text = await response.text();
            if (!text.includes('Welcome to Happy Server!')) {
                setError(t('server.notValidHappyServer'));
                return false;
            }
            return true;
        } catch {
            setError(t('server.failedToConnectToServer'));
            return false;
        } finally {
            setIsValidating(false);
        }
    };

    const handleAddServer = async () => {
        if (!inputUrl.trim()) {
            Modal.alert(t('common.error'), t('server.enterServerUrl'));
            return;
        }
        const validation = validateServerUrl(inputUrl);
        if (!validation.valid) {
            setError(validation.error || t('errors.invalidFormat'));
            return;
        }
        const isValid = await validateServer(inputUrl);
        if (!isValid) return;

        setInputUrl('');
        refreshServers();
    };

    const handleRemoveServer = async (serverUrl: string) => {
        const confirmed = await Modal.confirm(
            t('server.removeServer'),
            t('server.removeServerConfirm'),
            { confirmText: t('common.remove'), destructive: true }
        );
        if (confirmed) {
            sync.removeServer(serverUrl);
            removeServer(serverUrl);
            refreshServers();
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: t('server.servers'),
                    headerBackTitle: t('common.back'),
                }}
            />

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ItemList style={styles.itemListContainer}>
                    {/* Connected Servers */}
                    <ItemGroup title={t('server.connectedServers')}>
                        {servers.length === 0 && (
                            <Item
                                title={t('server.noServersRegistered')}
                                showChevron={false}
                            />
                        )}
                        {servers.map((server) => {
                            const hostname = getServerHostname(server.url);
                            const connStatus = socketStatus.status;
                            return (
                                <Item
                                    key={server.url}
                                    title={server.label || hostname}
                                    subtitle={server.label ? hostname : undefined}
                                    icon={
                                        <Ionicons
                                            name="server-outline"
                                            size={29}
                                            color={connStatus === 'connected' ? theme.colors.status.connected : theme.colors.status.disconnected}
                                        />
                                    }
                                    onPress={() => handleRemoveServer(server.url)}
                                />
                            );
                        })}
                    </ItemGroup>

                    {/* Add Server */}
                    <ItemGroup title={t('server.addServer')} footer={t('server.advancedFeatureFooter')}>
                        <View style={styles.contentContainer}>
                            <Text style={styles.labelText}>{t('server.customServerUrlLabel').toUpperCase()}</Text>
                            <TextInput
                                style={styles.textInput}
                                value={inputUrl}
                                onChangeText={(text) => {
                                    setInputUrl(text);
                                    setError(null);
                                }}
                                placeholder={t('common.urlPlaceholder')}
                                placeholderTextColor={theme.colors.input.placeholder}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                                editable={!isValidating}
                            />
                            {error && <Text style={styles.errorText}>{error}</Text>}
                            {isValidating && <Text style={styles.validatingText}>{t('server.validatingServer')}</Text>}
                            <View style={styles.buttonRow}>
                                <View style={styles.buttonWrapper}>
                                    <RoundButton
                                        title={isValidating ? t('server.validating') : t('server.addServer')}
                                        size="normal"
                                        action={handleAddServer}
                                        disabled={isValidating}
                                    />
                                </View>
                            </View>
                        </View>
                    </ItemGroup>
                </ItemList>
            </KeyboardAvoidingView>
        </>
    );
});
