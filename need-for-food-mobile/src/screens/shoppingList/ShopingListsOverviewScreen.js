import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import FilterTabBar from '../../components/shoppingList/FilterTabBar';
import ShoppingListCard from '../../components/shoppingList/ShoppingListCard';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as shoppingListApi from '../../api/shoppingListApi';

const TABS = ['Toutes', 'Récentes', 'En cours', 'Terminées'];
const RECENT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function toCard(list) {
    const total = list.items.length;
    const checkedCount = list.items.filter((i) => i.checked).length;
    const completed = total > 0 ? Math.round((checkedCount / total) * 100) : 0;
    const createdAt = new Date(list.createdAt);

    return {
        id: list.id,
        title: list.name,
        subtitle: `Créée le ${createdAt.toLocaleDateString('fr-FR')}`,
        emoji: '🛒',
        itemsLabel: `${checkedCount} / ${total} articles`,
        completed,
        createdAt,
    };
}

function matchesTab(list, tab) {
    switch (tab) {
        case 'Récentes':
            return Date.now() - list.createdAt.getTime() < RECENT_THRESHOLD_MS;
        case 'En cours':
            return list.completed < 100;
        case 'Terminées':
            return list.completed === 100;
        default:
            return true;
    }
}

export default function ShoppingListsOverviewScreen({ navigation }) {
    const { token } = useAuth();
    const [activeFilter, setActiveFilter] = useState('Toutes');
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    const data = await shoppingListApi.getMine(token);
                    if (!cancelled) setLists(data.map(toCard));
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger vos listes.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [token])
    );

    const filteredLists = lists.filter((list) => matchesTab(list, activeFilter));

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Mes Listes de Courses</Text>
                <Text style={styles.subtitle}>Préparez vos prochains festins</Text>

                <TouchableOpacity
                    style={styles.createButton}
                    activeOpacity={0.85}
                    onPress={() => navigation?.navigate('CreerListeCourses')}
                >
                    <View style={styles.createIconWrap}>
                        <Icon name="shopping-cart" size={18} color={colors.textOnDark} />
                    </View>
                    <Text style={styles.createLabel}>Créer une nouvelle liste</Text>
                    <Icon name="chevron-right" size={20} color={colors.textOnDark} />
                </TouchableOpacity>

                <FilterTabBar tabs={TABS} active={activeFilter} onChange={setActiveFilter} />

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
                ) : filteredLists.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="shopping-bag" size={22} color={colors.textSecondary} />
                        <Text style={styles.emptyStateText}>Aucune liste pour le moment.</Text>
                    </View>
                ) : (
                    filteredLists.map((list) => (
                        <ShoppingListCard
                            key={list.id}
                            list={list}
                            onPress={() => navigation?.navigate('ListeCourses', { id: list.id })}
                        />
                    ))
                )}
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
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.md,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    createIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    createLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: colors.textOnDark,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.sm,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingVertical: spacing.xl,
        marginTop: spacing.sm,
    },
    emptyStateText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: spacing.sm,
    },
});
