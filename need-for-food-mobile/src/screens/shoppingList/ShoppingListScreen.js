import React, { useCallback, useEffect, useState } from 'react';
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
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import CheckboxRow from '../../components/common/CheckboxRow';
import RecipePickRow from '../../components/shoppingList/RecipePickRow';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as shoppingListApi from '../../api/shoppingListApi';
import * as recipeApi from '../../api/recipeApi';
import { showAlert } from '../../utils/appAlert';
import { textIncludes } from '../../utils/text';

export default function ShoppingListScreen({ route, navigation }) {
    const { token } = useAuth();
    const listId = route?.params?.id;

    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [clearing, setClearing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [recipeSearch, setRecipeSearch] = useState('');
    const [myRecipes, setMyRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(true);
    const [addingRecipeId, setAddingRecipeId] = useState(null);
    const [addedRecipeIds, setAddedRecipeIds] = useState(new Set());

    const [draftName, setDraftName] = useState('');
    const [draftQuantity, setDraftQuantity] = useState('');
    const [draftUnit, setDraftUnit] = useState('');
    const [addingItem, setAddingItem] = useState(false);

    const [addSectionExpanded, setAddSectionExpanded] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    const data = await shoppingListApi.getById(token, listId);
                    if (!cancelled) setList(data);
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger la liste.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [listId, token])
    );

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const recipes = await recipeApi.getMine(token);
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

    const filteredRecipes = myRecipes.filter((recipe) => textIncludes(recipe.title, recipeSearch));

    const toggle = async (ingredientId, checked) => {
        try {
            const updated = await shoppingListApi.setItemChecked(token, listId, ingredientId, !checked);
            setList(updated);
        } catch (err) {
            setError(err.message || 'Impossible de mettre à jour cet article.');
        }
    };

    const removeItem = async (ingredientId) => {
        try {
            const updated = await shoppingListApi.removeItem(token, listId, ingredientId);
            setList(updated);
        } catch (err) {
            setError(err.message || 'Impossible de supprimer cet article.');
        }
    };

    const handleAddRecipeIngredients = async (recipe) => {
        setAddingRecipeId(recipe.id);
        setError('');
        try {
            let updated = list;
            for (const ingredient of recipe.ingredients) {
                updated = await shoppingListApi.addItem(token, listId, {
                    ingredientName: ingredient.name,
                    unit: ingredient.unit,
                    quantity: ingredient.quantity,
                });
            }
            setList(updated);
            setAddedRecipeIds((prev) => new Set(prev).add(recipe.id));
        } catch (err) {
            setError(err.message || "Impossible d'ajouter cette recette.");
        } finally {
            setAddingRecipeId(null);
        }
    };

    const handleAddManualItem = async () => {
        const trimmedName = draftName.trim();
        const trimmedUnit = draftUnit.trim();
        if (!trimmedName || !trimmedUnit || !(parseFloat(draftQuantity) > 0)) {
            setError('Renseignez un nom, une quantité et une unité valides pour l\'article.');
            return;
        }
        setError('');
        setAddingItem(true);
        try {
            const updated = await shoppingListApi.addItem(token, listId, {
                ingredientName: trimmedName,
                unit: trimmedUnit,
                quantity: parseFloat(draftQuantity),
            });
            setList(updated);
            setDraftName('');
            setDraftQuantity('');
            setDraftUnit('');
        } catch (err) {
            setError(err.message || "Impossible d'ajouter cet article.");
        } finally {
            setAddingItem(false);
        }
    };

    const handleClearAll = async () => {
        const checkedItems = list.items.filter((item) => item.checked);
        if (checkedItems.length === 0) return;

        setClearing(true);
        try {
            let updated = list;
            for (const item of checkedItems) {
                updated = await shoppingListApi.setItemChecked(token, listId, item.ingredientId, false);
            }
            setList(updated);
        } catch (err) {
            setError(err.message || "Impossible de tout effacer.");
        } finally {
            setClearing(false);
        }
    };

    const handleDeleteList = () => {
        showAlert(
            'Supprimer la liste',
            'Cette action est irréversible. Confirmer la suppression ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await shoppingListApi.remove(token, listId);
                            navigation?.navigate('MesListesCourses');
                        } catch (err) {
                            setDeleting(false);
                            setError(err.message || 'Impossible de supprimer la liste.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error && !list) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>{list.name}</Text>
                <Text style={styles.subtitle}>
                    {list.items.filter((i) => i.checked).length} / {list.items.length} articles cochés
                </Text>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <Text style={styles.sectionTitle}>Articles nécessaires ({list.items.length})</Text>
                {list.items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Icon name="shopping-bag" size={22} color={colors.textSecondary} />
                        <Text style={styles.emptyStateText}>Cette liste est vide.</Text>
                    </View>
                ) : (
                    list.items.map((item) => (
                        <CheckboxRow
                            key={item.ingredientId}
                            label={`${item.quantity}${item.unit} ${item.name}`}
                            checked={item.checked}
                            onToggle={() => toggle(item.ingredientId, item.checked)}
                            onDelete={() => removeItem(item.ingredientId)}
                        />
                    ))
                )}

                <TouchableOpacity
                    style={styles.clearButton}
                    activeOpacity={0.8}
                    onPress={handleClearAll}
                    disabled={clearing}
                >
                    {clearing ? (
                        <ActivityIndicator color={colors.textPrimary} size="small" />
                    ) : (
                        <>
                            <Icon name="rotate-ccw" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
                            <Text style={styles.clearLabel}>Tout effacer</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.expandableHeader}
                    activeOpacity={0.7}
                    onPress={() => setAddSectionExpanded((v) => !v)}
                >
                    <View style={styles.expandableHeaderLeft}>
                        <Icon name="plus-circle" size={18} color={colors.primaryDark} />
                        <Text style={styles.expandableHeaderText}>Ajouter une recette / un ingrédient</Text>
                    </View>
                    <Icon name={addSectionExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                {addSectionExpanded && (
                    <View style={styles.expandableBody}>
                        <Text style={styles.sectionTitle}>Depuis vos recettes</Text>
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
                                        selected={addedRecipeIds.has(recipe.id)}
                                        busy={addingRecipeId === recipe.id}
                                        onPress={() => handleAddRecipeIngredients(recipe)}
                                    />
                                ))}
                            </ScrollView>
                        )}

                        <Text style={styles.sectionTitle}>Ingrédient manuel</Text>
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
                            <TouchableOpacity
                                style={styles.addButton}
                                activeOpacity={0.85}
                                onPress={handleAddManualItem}
                                disabled={addingItem}
                            >
                                {addingItem ? (
                                    <ActivityIndicator size="small" color={colors.textOnDark} />
                                ) : (
                                    <Icon name="plus" size={16} color={colors.textOnDark} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={styles.deleteButton}
                    activeOpacity={0.8}
                    onPress={handleDeleteList}
                    disabled={deleting}
                >
                    {deleting ? (
                        <ActivityIndicator color={colors.danger} size="small" />
                    ) : (
                        <>
                            <Icon name="trash-2" size={16} color={colors.danger} style={{ marginRight: 8 }} />
                            <Text style={styles.deleteLabel}>Supprimer la liste</Text>
                        </>
                    )}
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
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    expandableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginTop: spacing.lg,
    },
    expandableHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandableHeaderText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    expandableBody: {
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing.md,
        marginTop: spacing.sm,
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
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        height: 50,
        marginTop: spacing.lg,
    },
    clearLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.pill,
        height: 50,
        marginTop: spacing.sm,
    },
    deleteLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.danger,
    },
});
