import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    View,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, typography, radius } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import CategoryChip from '../../components/home/CategoryChip';
import FeaturedRecipeCard from '../../components/home/FeaturedRecipeCard';
import RecipeCard from '../../components/common/RecipeCard';
import NewsRow from '../../components/home/NewsRow';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as recipeApi from '../../api/recipeApi';
import { filterByTitle, filterByCategory } from '../../utils/recipeFilters';

const CATEGORIES = [
    { key: 'populaire', label: 'Populaire', emoji: '🔥' },
    { key: 'favoris', label: 'Favoris', emoji: '❤️' },
    { key: 'vegetarien', label: 'Végétarien', emoji: '🌱' },
    { key: 'rapide', label: 'Rapide', emoji: '⏱️' },
];

function toCard(recipe) {
    return {
        id: recipe.id,
        title: recipe.title,
        time: recipe.preparationTime != null ? `${recipe.preparationTime} min` : '—',
        difficulty: recipe.difficulty || '—',
        diet: recipe.diet,
        preparationTime: recipe.preparationTime,
        favorite: !!recipe.favorite,
        badge: 'Suggestion pour vous',
        image: recipe.images?.[0]?.url ? { uri: recipe.images[0].url } : images.imagePlaceholder,
    };
}

function toNewsItem(recipe) {
    const subtitle = [
        recipe.preparationTime != null ? `${recipe.preparationTime} min` : null,
        recipe.type,
    ].filter(Boolean).join(' · ') || 'Nouvelle recette';

    return {
        id: recipe.id,
        title: recipe.title,
        subtitle,
        image: recipe.images?.[0]?.url ? { uri: recipe.images[0].url } : images.imagePlaceholder,
        favorite: !!recipe.favorite,
    };
}

export default function HomeScreen({ navigation }) {
    const { user, token } = useAuth();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('populaire');
    const [suggestions, setSuggestions] = useState([]);
    const [recent, setRecent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const firstName = user?.username?.split(' ')[0];

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    const [suggested, all] = await Promise.all([
                        recipeApi.getSuggestions(token),
                        recipeApi.getAll(token),
                    ]);
                    if (cancelled) return;
                    setSuggestions(suggested.map(toCard));
                    setRecent(
                        [...all]
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 4)
                            .map(toNewsItem)
                    );
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger les recettes.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [token])
    );

    const filteredSuggestions = filterByCategory(filterByTitle(suggestions, search), activeCategory);

    const [featuredRecipe, ...otherSuggestions] = filteredSuggestions;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerSide} />
                    <View style={styles.headerCenter}>
                        <Image source={images.appIcon} style={styles.logo}/>
                        <Text style={styles.headerTitle}>Need for Food</Text>
                    </View>
                    <TouchableOpacity style={styles.headerSide} onPress={() => navigation?.navigate('Profil')}>
                        <Image
                            source={user?.avatarUrl ? { uri: user.avatarUrl } : images.avatar}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                </View>

                {/* Salutation */}
                <Text style={styles.eyebrow}>Bon appétit !</Text>
                <Text style={styles.greeting}>Bonjour, {firstName}</Text>

                {/* Recherche */}
                <View style={styles.searchBar}>
                    <Icon name="search" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher par nom..."
                        placeholderTextColor={colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Catégories */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={typography.h2}>Catégories</Text>
                    <TouchableOpacity onPress={() => navigation?.navigate('ChercherRecettes')}>
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

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                {/* Recettes suggérées */}
                <Text style={[typography.h2, styles.sectionTitle]}>Recettes suggérées</Text>
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />
                ) : !featuredRecipe ? (
                    <TouchableOpacity
                        style={styles.emptyState}
                        activeOpacity={0.8}
                        onPress={() => navigation?.navigate('AjouterRecette')}
                    >
                        <Icon name="plus-circle" size={20} color={colors.primary} />
                        <Text style={styles.emptyStateText}>
                            Aucune recette ne correspond. Ajoutez-en une !
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <FeaturedRecipeCard
                            recipe={featuredRecipe}
                            onPress={() => navigation?.navigate('DetailsRecette', { id: featuredRecipe.id })}
                        />
                        <View style={styles.gridRow}>
                            {otherSuggestions.slice(0, 2).map((recipe) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    style={styles.gridItem}
                                    onPress={() => navigation?.navigate('DetailsRecette', { id: recipe.id })}
                                />
                            ))}
                        </View>
                    </>
                )}

                {/* Nouveautés */}
                <Text style={[typography.h2, styles.sectionTitle]}>Nouveautés</Text>
                {!loading && recent.length === 0 ? (
                    <Text style={styles.emptyRecentText}>Aucune recette dans la communauté pour l'instant.</Text>
                ) : (
                    recent.map((item) => (
                        <NewsRow
                            key={item.id}
                            item={item}
                            onPress={() => navigation?.navigate('DetailsRecette', { id: item.id })}
                        />
                    ))
                )}
            </ScrollView>

            <BottomNav />

            {/* Bouton flottant d'ajout — rendu après BottomNav pour toujours rester au-dessus */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.85}
                onPress={() => navigation?.navigate('AjouterRecette')}
            >
                <Icon name="plus" size={26} color={colors.textOnDark} />
            </TouchableOpacity>
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
    headerSide: {
        width: 40,
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        marginBottom: spacing.sm,
    },
    emptyState: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.lg,
    },
    emptyStateText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: spacing.sm,
        flexShrink: 1,
    },
    emptyRecentText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.md,
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
        bottom: 110,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
        zIndex: 20,
    },
    logo: {
        width: 36,
        height: 36,
    },
});
