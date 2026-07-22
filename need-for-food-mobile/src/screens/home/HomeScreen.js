import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, typography, radius } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import CategoryChip from '../../components/home/CategoryChip';
import FeaturedRecipeCard from '../../components/home/FeaturedRecipeCard';
import RecipeCard from '../../components/home/RecipeCard';
import NewsRow from '../../components/home/NewsRow';
import BottomNav from '../../components/common/BottomNav';

const CATEGORIES = [
    { key: 'populaire', label: 'Populaire', emoji: '🔥' },
    { key: 'vegetarien', label: 'Végétarien', emoji: '🌱' },
    { key: 'rapide', label: 'Rapide', emoji: '⏱️' },
];

const FEATURED_RECIPE = {
    id: 'pasta-pomodoro',
    title: 'Pasta Pomodoro & Burrata',
    time: '25 min',
    difficulty: 'Facile',
    badge: 'Coup de cœur',
    image: images.pastaPomodoro,
};

const SUGGESTED_RECIPES = [
    {
        id: 'buddha-bowl',
        title: 'Buddha Bowl...',
        time: '15 min',
        image: images.buddhaBowl,
    },
    {
        id: 'saumon-grille',
        title: 'Saumon Grillé au...',
        time: '20 min',
        image: images.saumonGrille,
    },
];

const NEWS = [
    {
        id: 'pancakes',
        title: 'Pancakes aux Myrtilles',
        subtitle: 'Parfait pour le brunch',
        image: images.pancakes,
    },
    {
        id: 'curry-thai',
        title: 'Curry Vert Thaï',
        subtitle: 'Voyage culinaire intense',
        image: images.curryThai,
    },
];

export default function HomeScreen({ navigation }) {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('populaire');

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image source={images.appIcon} style={styles.logo}/>
                        <Text style={styles.headerTitle}>Need for Food</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation?.navigate('Profil')}>
                        <Image
                            source={images.avatar}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                </View>

                {/* Salutation */}
                <Text style={styles.eyebrow}>Bon appétit !</Text>
                <Text style={styles.greeting}>Bonjour, Chef Julia</Text>

                {/* Recherche */}
                <View style={styles.searchBar}>
                    <Icon name="search" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher par nom ou ingrédient..."
                        placeholderTextColor={colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Catégories */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={typography.h2}>Catégories</Text>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>Voir tout</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesRow}
                >
                    {CATEGORIES.map((cat) => (
                        <CategoryChip
                            key={cat.key}
                            label={cat.label}
                            emoji={cat.emoji}
                            active={activeCategory === cat.key}
                            onPress={() => setActiveCategory(cat.key)}
                        />
                    ))}
                </ScrollView>

                {/* Recettes suggérées */}
                <Text style={[typography.h2, styles.sectionTitle]}>Recettes suggérées</Text>
                <FeaturedRecipeCard
                    recipe={FEATURED_RECIPE}
                    onPress={() => navigation?.navigate('DetailsRecette', { id: FEATURED_RECIPE.id })}
                />
                <View style={styles.gridRow}>
                    {SUGGESTED_RECIPES.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            style={styles.gridItem}
                            onPress={() => navigation?.navigate('DetailsRecette', { id: recipe.id })}
                        />
                    ))}
                </View>

                {/* Nouveautés */}
                <Text style={[typography.h2, styles.sectionTitle]}>Nouveautés</Text>
                {NEWS.map((item) => (
                    <NewsRow
                        key={item.id}
                        item={item}
                        onPress={() => navigation?.navigate('DetailsRecette', { id: item.id })}
                    />
                ))}
            </ScrollView>

            {/* Bouton flottant d'ajout */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate('AjouterRecette')}
            >
                <Icon name="plus" size={26} color={colors.textOnDark} />
            </TouchableOpacity>

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
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogoEmoji: {
        fontSize: 20,
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primaryDark,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.primarySoft,
    },
    eyebrow: {
        ...typography.eyebrow,
    },
    greeting: {
        ...typography.h1,
        marginBottom: spacing.md,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 48,
        marginBottom: spacing.lg,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 14,
        color: colors.textPrimary,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    linkText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    categoriesRow: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        marginBottom: spacing.sm,
    },
    gridRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    gridItem: {
        marginRight: 0,
    },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        bottom: 90,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    logo: {
        width: 36,
        height: 36,
    },
});