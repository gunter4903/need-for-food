import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import Header from '../../components/common/Header';
import { IngredientFilterChip, SelectionTag } from '../../components/recipe/IngredientFilterChip';
import RecipeMatchCard from '../../components/recipe/RecipeMatchCard';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as recipeApi from '../../api/recipeApi';
import * as ingredientApi from '../../api/ingredientApi';
import { filterByNameOrCreator, filterByType } from '../../utils/recipeFilters';
import { textIncludes } from '../../utils/text';

const TYPE_FILTERS = [
    'Tous',
    'Entrée',
    'Plat',
    'Dessert',
    'Boisson',
    'Apéritif',
    'Végétarien',
    'Végan',
    'Sans gluten',
    'Sans lactose',
];

function toCard(recipe, matchLabel, currentUserId) {
    return {
        id: recipe.id,
        title: recipe.title,
        time: recipe.preparationTime != null ? `${recipe.preparationTime} min` : '—',
        difficulty: recipe.difficulty || '—',
        type: recipe.type,
        diet: recipe.diet,
        matchLabel,
        image: recipe.images?.[0]?.url ? { uri: recipe.images[0].url } : images.imagePlaceholder,
        favorite: !!recipe.favorite,
        creatorUsername: recipe.username,
        creatorAvatarUrl: recipe.userAvatarUrl,
        isOwnRecipe: recipe.userId === currentUserId,
    };
}

export default function SearchRecipesScreen({ navigation }) {
    const { user, token } = useAuth();
    const [search, setSearch] = useState('');
    const [pantryIngredients, setPantryIngredients] = useState([]);
    const [selected, setSelected] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [resultsQuery, setResultsQuery] = useState('');
    const [activeTypes, setActiveTypes] = useState([]);
    const [pickerExpanded, setPickerExpanded] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    const [ingredients, recipes] = await Promise.all([
                        ingredientApi.getAll(token),
                        recipeApi.getSuggestions(token),
                    ]);
                    if (cancelled) return;
                    setPantryIngredients(ingredients.map((i) => i.name));
                    if (!hasSearched) {
                        setResults(recipes.map((r) => toCard(r, null, user?.id)));
                    }
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger les recettes.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [token, hasSearched, user?.id])
    );

    const toggleIngredient = (name) => {
        setSelected((prev) =>
            prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
        );
    };

    const toggleFavorite = async (id) => {
        const card = results.find((r) => r.id === id);
        if (!card) return;

        const nextFavorite = !card.favorite;
        setResults((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: nextFavorite } : r)));

        try {
            if (nextFavorite) {
                await recipeApi.addFavorite(token, id);
            } else {
                await recipeApi.removeFavorite(token, id);
            }
        } catch {
            setResults((prev) => prev.map((r) => (r.id === id ? { ...r, favorite: !nextFavorite } : r)));
        }
    };

    const filteredChips = pantryIngredients.filter((name) => textIncludes(name, search));

    const toggleType = (type) => {
        if (type === 'Tous') {
            setActiveTypes([]);
            return;
        }
        setActiveTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const visibleResults = filterByType(filterByNameOrCreator(results, resultsQuery), activeTypes);

    const handleFindRecipes = async () => {
        if (selected.length === 0) {
            setError('Sélectionnez au moins un ingrédient.');
            return;
        }
        setError('');
        setSearching(true);
        setHasSearched(true);
        try {
            const matches = await recipeApi.search(token, selected);
            setResults(matches.map((m) => toCard(m.recipe, `${m.matchedCount}/${m.totalCount} correspondants`, user?.id)));
            setPickerExpanded(false);
        } catch (err) {
            setError(err.message || 'Impossible de rechercher des recettes.');
        } finally {
            setSearching(false);
        }
    };

    const handleResetIngredientSearch = () => {
        setSelected([]);
        setHasSearched(false);
        setError('');
        setPickerExpanded(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={typography.h1}>Qu'y a-t-il dans votre garde-manger ?</Text>
                <Text style={styles.subtitle}>
                    Sélectionnez les ingrédients que vous avez pour trouver la recette parfaite.
                </Text>

                {/* Section 1 : sélection d'ingrédients, regroupée dans une carte pour se distinguer des résultats */}
                <View style={styles.pickerCard}>
                    <View style={styles.pickerHeader}>
                        <TouchableOpacity
                            style={styles.pickerHeaderToggle}
                            activeOpacity={0.7}
                            onPress={() => setPickerExpanded((v) => !v)}
                        >
                            <Icon name="filter" size={16} color={colors.primaryDark} />
                            <Text style={styles.pickerHeaderText}>
                                Ingrédients{selected.length > 0 ? ` (${selected.length})` : ''}
                            </Text>
                            <Icon
                                name={pickerExpanded ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={colors.textSecondary}
                                style={{ marginLeft: 6 }}
                            />
                        </TouchableOpacity>

                        {(hasSearched || selected.length > 0) && (
                            <TouchableOpacity
                                style={styles.resetLink}
                                activeOpacity={0.7}
                                onPress={handleResetIngredientSearch}
                                hitSlop={8}
                            >
                                <Icon name="rotate-ccw" size={13} color={colors.danger} />
                                <Text style={styles.resetLinkText}>Réinitialiser</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {pickerExpanded && (
                        <>
                            <TouchableOpacity onPress={() => navigation?.navigate('Preferences')}>
                                <Text style={styles.preferencesHint}>
                                    Recettes filtrées selon vos préférences · Modifier
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.searchBar}>
                                <Icon name="search" size={18} color={colors.textSecondary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Rechercher des ingrédients..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                                {!!search && (
                                    <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                                        <Icon name="x-circle" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {loading ? (
                                <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
                            ) : (
                                <View style={styles.chipsWrap}>
                                    {filteredChips.map((ingredient) => (
                                        <IngredientFilterChip
                                            key={ingredient}
                                            label={ingredient}
                                            active={selected.includes(ingredient)}
                                            onPress={() => toggleIngredient(ingredient)}
                                        />
                                    ))}
                                </View>
                            )}

                            {selected.length > 0 ? (
                                <View style={styles.selectionBlock}>
                                    <Text style={styles.selectionLabel}>Sélection :</Text>
                                    <View style={styles.selectionTags}>
                                        {selected.map((name) => (
                                            <SelectionTag
                                                key={name}
                                                label={name}
                                                onRemove={() => toggleIngredient(name)}
                                            />
                                        ))}
                                    </View>
                                </View>
                            ) : null}

                            {!!error && <Text style={styles.errorText}>{error}</Text>}

                            <TouchableOpacity
                                style={[styles.findButton, searching && styles.buttonDisabled]}
                                activeOpacity={0.85}
                                onPress={handleFindRecipes}
                                disabled={searching}
                            >
                                {searching ? (
                                    <ActivityIndicator color={colors.textOnDark} />
                                ) : (
                                    <>
                                        <Icon name="star" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                                        <Text style={typography.button}>Trouver des recettes</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Section 2 : résultats, avec ses propres filtres (nom/créateur, type) */}
                <Text style={styles.resultsSectionTitle}>
                    {hasSearched ? 'Résultats de la recherche' : 'Suggestions pour vous'}
                </Text>

                <View style={styles.searchBar}>
                    <Icon name="search" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher par nom ou créateur..."
                        placeholderTextColor={colors.textSecondary}
                        value={resultsQuery}
                        onChangeText={setResultsQuery}
                    />
                    {!!resultsQuery && (
                        <TouchableOpacity onPress={() => setResultsQuery('')} hitSlop={8}>
                            <Icon name="x-circle" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.typeFilterRow}
                >
                    {TYPE_FILTERS.map((type) => (
                        <IngredientFilterChip
                            key={type}
                            label={type}
                            active={type === 'Tous' ? activeTypes.length === 0 : activeTypes.includes(type)}
                            onPress={() => toggleType(type)}
                        />
                    ))}
                </ScrollView>

                <Text style={styles.resultsCount}>{visibleResults.length} résultats</Text>

                {visibleResults.map((recipe) => (
                    <RecipeMatchCard
                        key={recipe.id}
                        recipe={recipe}
                        onPress={() => navigation?.navigate('DetailsRecette', { id: recipe.id })}
                        onToggleFavorite={() => toggleFavorite(recipe.id)}
                    />
                ))}
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
        paddingBottom: spacing.xl,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.md,
    },
    pickerCard: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    pickerHeaderToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 1,
    },
    pickerHeaderText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
        marginLeft: 6,
    },
    resetLink: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resetLinkText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.danger,
        marginLeft: 4,
    },
    preferencesHint: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.md,
    },
    resultsSectionTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
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
        marginBottom: spacing.md,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 14,
        color: colors.textPrimary,
    },
    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        maxHeight: 92,
        overflow: 'hidden',
    },
    selectionBlock: {
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    selectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    selectionTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.sm,
    },
    findButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 52,
        marginBottom: spacing.lg,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    typeFilterRow: {
        marginBottom: spacing.sm,
    },
    resultsCount: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: spacing.sm,
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
});
