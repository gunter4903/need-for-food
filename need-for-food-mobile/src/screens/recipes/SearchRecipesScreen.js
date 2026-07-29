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

function toCard(recipe, matchLabel) {
    return {
        id: recipe.id,
        title: recipe.title,
        time: recipe.preparationTime != null ? `${recipe.preparationTime} min` : '—',
        difficulty: recipe.difficulty || '—',
        matchLabel,
        image: recipe.images?.[0]?.url ? { uri: recipe.images[0].url } : images.imagePlaceholder,
        favorite: !!recipe.favorite,
    };
}

export default function SearchRecipesScreen({ navigation }) {
    const { token } = useAuth();
    const [search, setSearch] = useState('');
    const [pantryIngredients, setPantryIngredients] = useState([]);
    const [selected, setSelected] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

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
                        setResults(recipes.map((r) => toCard(r, null)));
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
        }, [token, hasSearched])
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

    const filteredChips = pantryIngredients.filter((name) =>
        name.toLowerCase().includes(search.toLowerCase())
    );

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
            setResults(matches.map((m) => toCard(m.recipe, `${m.matchedCount}/${m.totalCount} correspondants`)));
        } catch (err) {
            setError(err.message || 'Impossible de rechercher des recettes.');
        } finally {
            setSearching(false);
        }
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

                <View style={styles.sectionHeaderRow}>
                    <Text style={typography.h2}>
                        {hasSearched ? 'Résultats de la recherche' : 'Suggestions pour vous'}
                    </Text>
                    <Text style={styles.resultsCount}>{results.length} résultats</Text>
                </View>

                {results.map((recipe) => (
                    <RecipeMatchCard
                        key={recipe.id}
                        recipe={recipe}
                        onPress={() => navigation?.navigate('DetailsRecette', { id: recipe.id })}
                        onToggleFavorite={() => toggleFavorite(recipe.id)}
                    />
                ))}
            </ScrollView>

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
        paddingBottom: spacing.xl,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.md,
    },
    preferencesHint: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
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
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    resultsCount: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
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
});
