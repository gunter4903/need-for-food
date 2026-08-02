import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import CheckboxRow from '../../components/common/CheckboxRow';
import RecipePickRow from '../../components/shoppingList/RecipePickRow';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as shoppingListApi from '../../api/shoppingListApi';
import * as recipeApi from '../../api/recipeApi';
import { textIncludes } from '../../utils/text';
import { scaleIngredients } from '../../utils/servingsScale';

let nextId = 1;

export default function CreateShoppingListScreen({ navigation }) {
    const { token } = useAuth();
    const [listName, setListName] = useState('');
    const [draftName, setDraftName] = useState('');
    const [draftQuantity, setDraftQuantity] = useState('');
    const [draftUnit, setDraftUnit] = useState('');
    const [items, setItems] = useState([]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const [recipeSearch, setRecipeSearch] = useState('');
    const [availableRecipes, setMyRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(true);
    const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
    const [recipeServings, setRecipeServings] = useState({});

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const recipes = await recipeApi.getAll(token);
                if (!cancelled) setMyRecipes(recipes);
            } catch {
                // silencieux : la section recettes reste vide en cas d'erreur
            } finally {
                if (!cancelled) setLoadingRecipes(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const filteredRecipes = availableRecipes.filter((recipe) => textIncludes(recipe.title, recipeSearch));

    const toggleRecipeSelection = (recipeId) => {
        setSelectedRecipeIds((prev) =>
            prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
        );
        setRecipeServings((prev) => {
            const next = { ...prev };
            delete next[recipeId];
            return next;
        });
    };

    const setRecipeServingsValue = (recipeId, value) => {
        setRecipeServings((prev) => ({ ...prev, [recipeId]: value }));
    };

    const handleAddItem = () => {
        const trimmedName = draftName.trim();
        const trimmedUnit = draftUnit.trim();
        if (!trimmedName || !trimmedUnit || !(parseFloat(draftQuantity) > 0)) {
            setError('Renseignez un nom, une quantité et une unité valides pour l\'article.');
            return;
        }
        setError('');
        setItems((prev) => [
            ...prev,
            { id: `item-${nextId++}`, name: trimmedName, quantity: draftQuantity, unit: trimmedUnit, checked: false },
        ]);
        setDraftName('');
        setDraftQuantity('');
        setDraftUnit('');
    };

    const toggleItem = (id) =>
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

    const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

    const handleCreate = async () => {
        if (!listName.trim()) {
            setError('Le nom de la liste est obligatoire.');
            return;
        }
        setError('');
        setSaving(true);
        try {
            const list = await shoppingListApi.create(token, listName.trim());

            for (const recipeId of selectedRecipeIds) {
                const recipe = availableRecipes.find((r) => r.id === recipeId);
                if (!recipe) continue;
                const target = recipeServings[recipeId] ?? recipe.servings;
                const scaled = scaleIngredients(recipe.ingredients, recipe.servings, target);
                for (const ingredient of scaled) {
                    await shoppingListApi.addItem(token, list.id, {
                        ingredientName: ingredient.name,
                        unit: ingredient.unit,
                        quantity: ingredient.quantity,
                    });
                }
            }

            for (const item of items) {
                await shoppingListApi.addItem(token, list.id, {
                    ingredientName: item.name,
                    unit: item.unit,
                    quantity: parseFloat(item.quantity),
                });
            }
            navigation?.navigate('MesListesCourses');
        } catch (err) {
            setError(err.message || 'Impossible de créer la liste.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <Text style={typography.h1}>Créer une nouvelle liste</Text>
                    <Text style={styles.subtitle}>
                        Organisez vos prochaines courses en un clin d'œil.
                    </Text>

                    <FormInput
                        label="Nom de la liste"
                        placeholder="Ex: Dîner de samedi"
                        value={listName}
                        onChangeText={setListName}
                    />

                    <Text style={styles.sectionTitle}>Ajouter depuis vos recettes</Text>
                    <View style={styles.searchBar}>
                        <Icon name="search" size={16} color={colors.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher une recette par son nom..."
                            placeholderTextColor={colors.textSecondary}
                            value={recipeSearch}
                            onChangeText={setRecipeSearch}
                        />
                    </View>

                    {loadingRecipes ? (
                        <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} />
                    ) : filteredRecipes.length === 0 ? (
                        <Text style={styles.emptyRecipesText}>Aucune recette trouvée.</Text>
                    ) : (
                        <ScrollView
                            style={styles.recipesList}
                            nestedScrollEnabled
                            showsVerticalScrollIndicator={false}
                        >
                            {filteredRecipes.map((recipe) => (
                                <RecipePickRow
                                    key={recipe.id}
                                    recipe={recipe}
                                    selected={selectedRecipeIds.includes(recipe.id)}
                                    onPress={() => toggleRecipeSelection(recipe.id)}
                                    servings={recipeServings[recipe.id]}
                                    onServingsChange={(value) => setRecipeServingsValue(recipe.id, value)}
                                    servingsEditable={selectedRecipeIds.includes(recipe.id)}
                                />
                            ))}
                        </ScrollView>
                    )}

                    <Text style={styles.sectionTitle}>Ajouter un article manuellement</Text>

                    <FormInput
                        placeholder="Nom de l'article (ex: Farine)"
                        value={draftName}
                        onChangeText={setDraftName}
                        containerStyle={styles.draftNameField}
                    />
                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.quantityInput}
                            placeholder="Quantité"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                            value={draftQuantity}
                            onChangeText={setDraftQuantity}
                        />
                        <TextInput
                            style={styles.unitInput}
                            placeholder="Unité (g, ml, pièce...)"
                            placeholderTextColor={colors.textSecondary}
                            value={draftUnit}
                            onChangeText={setDraftUnit}
                        />
                        <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={handleAddItem}>
                            <Icon name="plus" size={16} color={colors.textOnDark} />
                        </TouchableOpacity>
                    </View>

                    {!!error && <Text style={styles.errorText}>{error}</Text>}

                    {items.map((item) => (
                        <CheckboxRow
                            key={item.id}
                            label={`${item.quantity}${item.unit} ${item.name}`}
                            checked={item.checked}
                            onToggle={() => toggleItem(item.id)}
                            onDelete={() => removeItem(item.id)}
                        />
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.createButton, saving && styles.buttonDisabled]}
                        activeOpacity={0.85}
                        onPress={handleCreate}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={colors.textOnDark} />
                        ) : (
                            <>
                                <Icon name="check-circle" size={18} color={colors.textOnDark} style={{ marginRight: 8 }} />
                                <Text style={typography.button}>Créer la liste</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

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
        paddingBottom: spacing.lg,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: spacing.md,
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
        height: 46,
        marginBottom: spacing.sm,
    },
    searchInput: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 14,
        color: colors.textPrimary,
    },
    emptyRecipesText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    recipesList: {
        maxHeight: 170,
        marginBottom: spacing.sm,
    },
    draftNameField: {
        marginBottom: spacing.sm,
    },
    addRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    quantityInput: {
        width: 90,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.card,
        fontSize: 14,
        color: colors.textPrimary,
    },
    unitInput: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.card,
        fontSize: 14,
        color: colors.textPrimary,
    },
    addButton: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.sm,
    },
    footer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.pill,
        height: 54,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});
