import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import MultiPhotoPicker from '../../components/common/MultiPhotoPicker';
import FormInput from '../../components/common/FormInput';
import SelectField from '../../components/recipe/SelectField';
import SectionCard from '../../components/recipe/SectionCard';
import IngredientInputRow from '../../components/recipe/IngredientInputRow';
import { EditableStepRow } from '../../components/recipe/EditableListRow';
import DashedButton from '../../components/recipe/DashedButton';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as recipeApi from '../../api/recipeApi';
import { copyPickedAssetsToCache } from '../../utils/imagePicker';

const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'];
const TYPES = ['Non défini', 'Entrée', 'Plat', 'Dessert', 'Boisson', 'Apéritif'];
const DIETS = ['Aucun', 'Végétarien', 'Végan', 'Sans gluten', 'Sans lactose'];
const MAX_IMAGES = 5;

let nextId = 1;
const makeId = () => `edit-item-${nextId++}`;

export default function EditRecipeScreen({ route, navigation }) {
    const { token } = useAuth();
    const recipeId = route?.params?.id;

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [images, setImages] = useState([]);
    const [originalImageIds, setOriginalImageIds] = useState([]);
    const [name, setName] = useState('');
    const [time, setTime] = useState('');
    const [difficulty, setDifficulty] = useState('Facile');
    const [type, setType] = useState('Non défini');
    const [diet, setDiet] = useState('Aucun');
    const [ingredients, setIngredients] = useState([]);
    const [steps, setSteps] = useState([]);

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const recipe = await recipeApi.getById(token, recipeId);
                if (cancelled) return;

                const existingImages = recipe.images.map((img) => ({
                    key: `existing-${img.id}`,
                    uri: img.url,
                    isNew: false,
                    id: img.id,
                }));
                setImages(existingImages);
                setOriginalImageIds(existingImages.map((img) => img.id));
                setName(recipe.title);
                setTime(recipe.preparationTime != null ? String(recipe.preparationTime) : '');
                setDifficulty(recipe.difficulty || 'Facile');
                setType(recipe.type || 'Non défini');
                setDiet(recipe.diet || 'Aucun');
                setIngredients(
                    recipe.ingredients.map((ri) => ({
                        id: makeId(),
                        name: ri.name,
                        quantity: String(ri.quantity),
                        unit: ri.unit,
                    }))
                );
                setSteps(recipe.steps.map((value) => ({ id: makeId(), value })));
            } catch (err) {
                if (!cancelled) setLoadError(err.message || 'Impossible de charger la recette.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [recipeId, token]);

    const addIngredient = () =>
        setIngredients((prev) => [...prev, { id: makeId(), name: '', quantity: '', unit: '' }]);
    const updateIngredient = (id, field, value) =>
        setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    const removeIngredient = (id) =>
        setIngredients((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));

    const addStep = () => setSteps((prev) => [...prev, { id: makeId(), value: '' }]);
    const updateStep = (id, value) =>
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));
    const removeStep = (id) =>
        setSteps((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));

    const handlePickPhotos = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError("L'accès à vos photos est nécessaire pour ajouter une image.");
            return;
        }

        const remaining = MAX_IMAGES - images.length;
        if (remaining <= 0) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            allowsEditing: false,
            selectionLimit: remaining,
            quality: 0.7,
        });

        if (!result.canceled) {
            const copied = await copyPickedAssetsToCache(result.assets);
            const picked = copied.map((asset) => ({
                key: `new-${asset.uri}`,
                ...asset,
                isNew: true,
            }));
            setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
        }
    };

    const handleRemovePhoto = (key) => {
        setImages((prev) => prev.filter((image) => image.key !== key));
    };

    const handleUpdate = async () => {
        const cleanIngredients = ingredients
            .filter((i) => i.name.trim())
            .map((i) => ({ ingredientName: i.name.trim(), unit: i.unit.trim(), quantity: parseFloat(i.quantity) }));
        const cleanSteps = steps.map((s) => s.value.trim()).filter(Boolean);

        if (!name.trim()) {
            setError('Le nom de la recette est obligatoire.');
            return;
        }
        if (cleanIngredients.length === 0) {
            setError('Ajoutez au moins un ingrédient.');
            return;
        }
        if (cleanIngredients.some((i) => !i.unit || !(i.quantity > 0))) {
            setError('Chaque ingrédient doit avoir une quantité et une unité valides.');
            return;
        }
        if (cleanSteps.length === 0) {
            setError('Ajoutez au moins une étape de préparation.');
            return;
        }

        setError('');
        setSaving(true);
        try {
            await recipeApi.update(token, recipeId, {
                title: name.trim(),
                difficulty,
                type: type === 'Non défini' ? null : type,
                diet: diet === 'Aucun' ? null : diet,
                preparationTime: parseInt(time, 10) || null,
                ingredients: cleanIngredients,
                steps: cleanSteps,
            });

            const remainingExistingIds = images.filter((image) => !image.isNew).map((image) => image.id);
            const removedIds = originalImageIds.filter((id) => !remainingExistingIds.includes(id));
            const newlyPicked = images.filter((image) => image.isNew);

            try {
                for (const imageId of removedIds) {
                    await recipeApi.removeImage(token, recipeId, imageId);
                }
                if (newlyPicked.length > 0) {
                    await recipeApi.addImages(token, recipeId, newlyPicked);
                }
            } catch (imageErr) {
                console.error('Échec de la synchronisation des photos:', imageErr);
                Alert.alert(
                    'Recette mise à jour',
                    `La recette a été mise à jour mais la synchronisation des photos a échoué : ${imageErr.message || imageErr}`
                );
            }

            navigation?.goBack();
        } catch (err) {
            setError(err.message || 'Impossible de mettre à jour la recette.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Supprimer la recette',
            'Cette action est irréversible. Confirmer la suppression ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await recipeApi.remove(token, recipeId);
                            navigation?.navigate('Accueil');
                        } catch (err) {
                            setDeleting(false);
                            setError(err.message || 'Impossible de supprimer la recette.');
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

    if (loadError) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{loadError}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.eyebrow}>MODIFIER LA RECETTE</Text>
                <Text style={typography.h1}>{name}</Text>

                <View style={styles.photoBlock}>
                    <MultiPhotoPicker
                        images={images}
                        onAdd={handlePickPhotos}
                        onRemove={handleRemovePhoto}
                        maxCount={MAX_IMAGES}
                    />
                </View>

                <SectionCard icon="info" title="Informations">
                    <FormInput label="Nom de la recette" value={name} onChangeText={setName} />
                    <View style={styles.row}>
                        <FormInput
                            label="Temps (min)"
                            keyboardType="number-pad"
                            value={time}
                            onChangeText={setTime}
                            containerStyle={styles.halfField}
                        />
                        <SelectField
                            label="Difficulté"
                            value={difficulty}
                            options={DIFFICULTIES}
                            onSelect={setDifficulty}
                            containerStyle={styles.halfField}
                        />
                    </View>
                    <View style={styles.row}>
                        <SelectField
                            label="Type"
                            value={type}
                            options={TYPES}
                            onSelect={setType}
                            containerStyle={styles.halfField}
                        />
                        <SelectField
                            label="Régime"
                            value={diet}
                            options={DIETS}
                            onSelect={setDiet}
                            containerStyle={styles.halfField}
                        />
                    </View>
                </SectionCard>

                <SectionCard icon="scissors" title="Ingrédients" onAdd={addIngredient}>
                    {ingredients.map((ingredient, index) => (
                        <IngredientInputRow
                            key={ingredient.id}
                            index={index + 1}
                            name={ingredient.name}
                            quantity={ingredient.quantity}
                            unit={ingredient.unit}
                            onChangeName={(text) => updateIngredient(ingredient.id, 'name', text)}
                            onChangeQuantity={(text) => updateIngredient(ingredient.id, 'quantity', text)}
                            onChangeUnit={(text) => updateIngredient(ingredient.id, 'unit', text)}
                            onRemove={ingredients.length > 1 ? () => removeIngredient(ingredient.id) : undefined}
                        />
                    ))}
                </SectionCard>

                <SectionCard icon="list" title="Étapes" onAdd={addStep}>
                    {steps.map((step, index) => (
                        <EditableStepRow
                            key={step.id}
                            number={index + 1}
                            content={step.value}
                            onChangeText={(text) => updateStep(step.id, text)}
                            onDelete={steps.length > 1 ? () => removeStep(step.id) : undefined}
                            isLast={index === steps.length - 1}
                        />
                    ))}
                </SectionCard>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.updateButton, saving && styles.buttonDisabled]}
                    activeOpacity={0.85}
                    onPress={handleUpdate}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={colors.textOnDark} />
                    ) : (
                        <>
                            <Icon name="save" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                            <Text style={typography.button}>Mettre à jour</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteButton}
                    activeOpacity={0.85}
                    onPress={handleDelete}
                    disabled={deleting}
                >
                    {deleting ? (
                        <ActivityIndicator color={colors.danger} size="small" />
                    ) : (
                        <>
                            <Icon name="trash-2" size={16} color={colors.danger} style={{ marginRight: 8 }} />
                            <Text style={styles.deleteLabel}>Supprimer</Text>
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
    eyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    photoBlock: {
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    halfField: {
        flex: 1,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.pill,
        height: 52,
        marginTop: spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.pill,
        height: 52,
        marginTop: spacing.sm,
    },
    deleteLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.danger,
    },
});
