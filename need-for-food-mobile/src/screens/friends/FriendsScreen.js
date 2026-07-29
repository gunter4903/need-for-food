import React, { useCallback, useState } from 'react';
import { ScrollView, View, Image, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import BottomNav from '../../components/common/BottomNav';
import images from '../../../assets/images/temp/images';
import { useAuth } from '../../context/AuthContext';
import * as friendApi from '../../api/friendApi';
import { showAlert } from '../../utils/appAlert';

const STATUS_LABELS = {
    NONE: null,
    PENDING_SENT: 'En attente',
    PENDING_RECEIVED: 'Vous a demandé',
    FRIENDS: 'Déjà ami',
};

function UserIdentity({ user, onPress }) {
    return (
        <TouchableOpacity style={styles.identity} activeOpacity={0.7} onPress={onPress}>
            <Image
                source={user.avatarUrl ? { uri: user.avatarUrl } : images.avatar}
                style={styles.rowAvatar}
            />
            <Text style={styles.rowLabel} numberOfLines={1}>{user.username}</Text>
        </TouchableOpacity>
    );
}

export default function FriendsScreen({ navigation }) {
    const { token } = useAuth();
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [friends, setFriends] = useState([]);
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [busyId, setBusyId] = useState(null);

    const goToProfile = (userId, isFriend) => navigation?.navigate('ProfilAmi', { userId, isFriend });

    const loadLists = useCallback(async () => {
        const [friendsData, receivedData, sentData] = await Promise.all([
            friendApi.getFriends(token),
            friendApi.getReceivedRequests(token),
            friendApi.getSentRequests(token),
        ]);
        setFriends(friendsData);
        setReceived(receivedData);
        setSent(sentData);
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    await loadLists();
                    if (cancelled) return;
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger vos amis.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [loadLists])
    );

    const handleSearch = async () => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }
        setError('');
        setSearching(true);
        try {
            const results = await friendApi.searchUsers(token, query.trim());
            setSearchResults(results);
        } catch (err) {
            setError(err.message || 'Impossible de rechercher des utilisateurs.');
        } finally {
            setSearching(false);
        }
    };

    const withBusy = async (id, action) => {
        setError('');
        setInfo('');
        setBusyId(id);
        try {
            await action();
        } catch (err) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setBusyId(null);
        }
    };

    const handleAdd = (result) =>
        withBusy(result.user.id, async () => {
            await friendApi.sendRequest(token, result.user.id);
            setInfo('Demande envoyée.');
            await handleSearch();
            await loadLists();
        });

    const handleAccept = (request) =>
        withBusy(request.id, async () => {
            await friendApi.acceptRequest(token, request.id);
            await loadLists();
        });

    const handleRejectOrCancel = (request) =>
        withBusy(request.id, async () => {
            await friendApi.cancelOrRejectRequest(token, request.id);
            await loadLists();
        });

    const confirmRemoveFriend = (friend) => {
        showAlert(
            'Retirer cet ami',
            `Cette action est irréversible. Confirmer le retrait de ${friend.username} de vos amis ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Retirer',
                    style: 'destructive',
                    onPress: () =>
                        withBusy(friend.id, async () => {
                            await friendApi.removeFriend(token, friend.id);
                            await loadLists();
                        }),
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Header onAvatarPress={() => navigation?.navigate('Profil')} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Amis</Text>
                <Text style={styles.subtitle}>
                    Ajoutez des amis pour voir leurs recettes. Les recettes des autres utilisateurs restent privées.
                </Text>

                {!!error && <Text style={styles.errorText}>{error}</Text>}
                {!!info && <Text style={styles.infoText}>{info}</Text>}

                <FormInput
                    icon="search"
                    placeholder="Rechercher par nom ou e-mail..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />

                {searching ? (
                    <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />
                ) : searchResults ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Résultats</Text>
                        {searchResults.length === 0 ? (
                            <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
                        ) : (
                            <ScrollView style={styles.resultsScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                {searchResults.map((result) => (
                                    <View key={result.user.id} style={styles.row}>
                                        <UserIdentity
                                            user={result.user}
                                            onPress={() => goToProfile(result.user.id, result.friendshipStatus === 'FRIENDS')}
                                        />
                                        {result.friendshipStatus === 'NONE' ? (
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={() => handleAdd(result)}
                                                disabled={busyId === result.user.id}
                                            >
                                                {busyId === result.user.id ? (
                                                    <ActivityIndicator size="small" color={colors.textOnDark} />
                                                ) : (
                                                    <Text style={styles.actionButtonLabel}>Ajouter</Text>
                                                )}
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.statusLabel}>{STATUS_LABELS[result.friendshipStatus]}</Text>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                ) : null}

                {received.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Demandes reçues</Text>
                        {received.map((request) => (
                            <View key={request.id} style={styles.row}>
                                <UserIdentity user={request.requester} onPress={() => goToProfile(request.requester.id, false)} />
                                <View style={styles.rowActions}>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleAccept(request)}
                                        disabled={busyId === request.id}
                                    >
                                        {busyId === request.id ? (
                                            <ActivityIndicator size="small" color={colors.textOnDark} />
                                        ) : (
                                            <Text style={styles.actionButtonLabel}>Accepter</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.iconButton}
                                        onPress={() => handleRejectOrCancel(request)}
                                        disabled={busyId === request.id}
                                    >
                                        <Icon name="x" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {sent.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Demandes envoyées</Text>
                        {sent.map((request) => (
                            <View key={request.id} style={styles.row}>
                                <UserIdentity user={request.addressee} onPress={() => goToProfile(request.addressee.id, false)} />
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => handleRejectOrCancel(request)}
                                    disabled={busyId === request.id}
                                >
                                    {busyId === request.id ? (
                                        <ActivityIndicator size="small" color={colors.textSecondary} />
                                    ) : (
                                        <Text style={styles.cancelLabel}>Annuler</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mes amis ({friends.length})</Text>
                    {friends.length === 0 ? (
                        <Text style={styles.emptyText}>
                            Vous n'avez pas encore d'ami. Recherchez quelqu'un ci-dessus pour commencer.
                        </Text>
                    ) : (
                        friends.map((friend) => (
                            <View key={friend.id} style={styles.row}>
                                <UserIdentity user={friend} onPress={() => goToProfile(friend.id, true)} />
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => confirmRemoveFriend(friend)}
                                    disabled={busyId === friend.id}
                                >
                                    {busyId === friend.id ? (
                                        <ActivityIndicator size="small" color={colors.textSecondary} />
                                    ) : (
                                        <Icon name="user-x" size={18} color={colors.danger} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <BottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.md,
    },
    infoText: {
        color: colors.primary,
        fontSize: 13,
        marginBottom: spacing.md,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    resultsScroll: {
        maxHeight: 170,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    identity: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
        marginRight: spacing.sm,
    },
    rowAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: spacing.sm,
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        flexShrink: 1,
    },
    rowActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    actionButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        minWidth: 84,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textOnDark,
    },
    iconButton: {
        padding: spacing.xs,
    },
    cancelLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
});
