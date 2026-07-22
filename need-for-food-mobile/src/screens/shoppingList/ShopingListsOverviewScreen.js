import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import FilterTabBar from '../../components/shoppingList/FilterTabBar';
import ShoppingListCard from '../../components/shoppingList/ShoppingListCard';
import BottomNav from '../../components/common/BottomNav';

const TABS = ['Toutes', 'Récentes', 'En cours', 'Terminées'];

const LISTS = [
    {
        id: 'courses-hebdo',
        title: 'Courses Hebdo',
        subtitle: 'Modifiée il y a 2h',
        emoji: '📅',
        itemsLabel: '12 / 20 articles',
        completed: 60,
    },
    {
        id: 'soiree-pizza',
        title: 'Soirée Pizza',
        subtitle: 'Modifiée hier',
        emoji: '🍕',
        itemsLabel: '8 / 8 articles',
        completed: 100,
    },
    {
        id: 'barbecue-dimanche',
        title: 'Barbecue Dimanche',
        subtitle: 'Créée le 12 Mai',
        emoji: '🍖',
        itemsLabel: '3 / 15 articles',
        completed: 20,
    },
    {
        id: 'fond-de-placard',
        title: 'Fond de Placard',
        subtitle: 'Modifiée il y a 3 jours',
        emoji: '🗄️',
        itemsLabel: '2 / 12 articles',
        completed: 16,
    },
];

export default function ShoppingListsOverviewScreen({ navigation }) {
    const [activeFilter, setActiveFilter] = useState('Toutes');

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

                {LISTS.map((list) => (
                    <ShoppingListCard
                        key={list.id}
                        list={list}
                        onPress={() => navigation?.navigate('ListeCourses', { id: list.id })}
                    />
                ))}

                <TouchableOpacity style={styles.reuseButton} activeOpacity={0.8}>
                    <Icon name="rotate-ccw" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
                    <Text style={styles.reuseLabel}>Réutiliser</Text>
                </TouchableOpacity>
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
    reuseButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.pill,
        height: 50,
        marginTop: spacing.xs,
    },
    reuseLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
});