import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import Header from '../../components/common/Header';
import { IngredientFilterChip, SelectionTag } from '../../components/recipe/IngredientFilterChip';
import RecipeMatchCard from '../../components/recipe/RecipeMatchCard';
import BottomNav from '../../components/common/BottomNav';

const PANTRY_INGREDIENTS = [
    'Tomate', 'Pâtes', 'Poulet', 'Oignon', 'Œufs', 'Ail', 'Basilic', 'Fromage',
];

const RESULTS = [
    {
        id: 'pates-tomate',
        title: 'Pâtes à la Tomate',
        time: '20 min',
        difficulty: 'Facile',
        matchLabel: '2/3 correspondants',
        image: images.patesTomate,
        favorite: true,
    },
    {
        id: 'poulet-tomates-roties',
        title: 'Poulet aux Tomates Rôties',
        time: '45 min',
        difficulty: 'Moyen',
        matchLabel: '3/4 correspondants',
        image: images.pouletTomatesRoties,
        favorite: false,
    },
    {
        id: 'bowl-fusion-placard',
        title: 'Bowl Fusion du Placard',
        time: '15 min',
        difficulty: 'Très facile',
        matchLabel: '4/4 correspondants',
        image: images.bowlFusionPlacard,
        favorite: false,
    },
];

export default function SearchRecipesScreen({ navigation }) {
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(['Tomate', 'Poulet']);
    const [results, setResults] = useState(RESULTS);

    const toggleIngredient = (name) => {
        setSelected((prev) =>
            prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
        );
    };

    const toggleFavorite = (id) => {
        setResults((prev) =>
            prev.map((r) => (r.id === id ? { ...r, favorite: !r.favorite } : r))
        );
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

                <View style={styles.chipsWrap}>
                    {PANTRY_INGREDIENTS.map((ingredient) => (
                        <IngredientFilterChip
                            key={ingredient}
                            label={ingredient}
                            active={selected.includes(ingredient)}
                            onPress={() => toggleIngredient(ingredient)}
                        />
                    ))}
                </View>

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

                <TouchableOpacity style={styles.findButton} activeOpacity={0.85}>
                    <Icon name="star" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                    <Text style={typography.button}>Trouver des recettes</Text>
                </TouchableOpacity>

                <View style={styles.sectionHeaderRow}>
                    <Text style={typography.h2}>Suggestions pour vous</Text>
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
    findButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 52,
        marginBottom: spacing.lg,
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
});