import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Modal,
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
import { showAlert } from '../../utils/appAlert';
import { recognizeTextFromImage, parseRecipeText } from '../../utils/recipeScan';

const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'];
const TYPES = ['Non défini', 'Entrée', 'Plat', 'Dessert', 'Boisson', 'Apéritif'];
const DIETS = ['Aucun', 'Végétarien', 'Végan', 'Sans gluten', 'Sans lactose'];
const MAX_IMAGES = 5;
const SCAN_SCOPES = [
    { value: 'all', label: 'Toute la recette' },
    { value: 'ingredients', label: 'Ingrédients seulement' },
    { value: 'steps', label: 'Étapes seulement' },
];

let nextId = 1;
const makeId = () => `item-${nextId++}`;

export default function AddRecipeScreen({ navigation }) {
    const { token } = useAuth();
    const [images, setImages] = useState([]);
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [servings, setServings] = useState('');
    const [difficulty, setDifficulty] = useState('Facile');
    const [type, setType] = useState('Non défini');
    const [diet, setDiet] = useState('Aucun');
    const [ingredients, setIngredients] = useState([{ id: makeId(), name: '', quantity: '', unit: '' }]);
    const [steps, setSteps] = useState([{ id: makeId(), value: '' }]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanReviewVisible, setScanReviewVisible] = useState(false);
    const [scanReviewText, setScanReviewText] = useState('');
    const [scanScope, setScanScope] = useState('all');

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
            }));
            setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
        }
    };

    const handleRemovePhoto = (key) => {
        setImages((prev) => prev.filter((image) => image.key !== key));
    };

    const hasExistingContent = () =>
        !!title.trim() ||
        ingredients.some((i) => i.name.trim()) ||
        steps.some((s) => s.value.trim());

    const hasExistingContentForScope = (scope) => {
        if (scope === 'ingredients') return ingredients.some((i) => i.name.trim());
        if (scope === 'steps') return steps.some((s) => s.value.trim());
        return hasExistingContent();
    };

    const applyScanResult = (parsed) => {
        if (parsed.title) setTitle(parsed.title);
        if (parsed.servings) setServings(parsed.servings);
        if (parsed.ingredients.length > 0) {
            setIngredients(
                parsed.ingredients.map((i) => ({ id: makeId(), name: i.name, quantity: i.quantity, unit: i.unit }))
            );
        }
        if (parsed.steps.length > 0) {
            setSteps(parsed.steps.map((s) => ({ id: makeId(), value: s })));
        }
        showAlert(
            'Recette scannée',
            'Les champs ont été préremplis à partir du texte reconnu — vérifiez et corrigez-les avant d\'enregistrer, la reconnaissance n\'est pas toujours parfaite.'
        );
    };

    const runScan = async (source) => {
        const permission =
            source === 'camera'
                ? await ImagePicker.requestCameraPermissionsAsync()
                : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError(
                source === 'camera'
                    ? "L'accès à l'appareil photo est nécessaire pour scanner une recette."
                    : "L'accès à vos photos est nécessaire pour scanner une recette."
            );
            return;
        }

        const result =
            source === 'camera'
                ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
                : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
        if (result.canceled || !result.assets?.[0]) return;

        setScanning(true);
        try {
            const rawText = await recognizeTextFromImage(result.assets[0].uri);
            if (!rawText || !rawText.trim()) {
                showAlert('Aucun texte détecté', "Essayez avec une photo plus nette, mieux éclairée, ou cadrée sur le texte.");
                return;
            }
            setScanReviewText(rawText);
            setScanScope('all');
            setScanReviewVisible(true);
        } catch (err) {
            showAlert('Scan impossible', err.message || "Une erreur est survenue pendant l'analyse de l'image.");
        } finally {
            setScanning(false);
        }
    };

    const handleScanRecipe = () => {
        showAlert(
            'Scanner une recette',
            "Prendre une photo ou choisir une image existante ? Fonctionne mieux sur du texte imprimé (site, livre) que sur de l'écriture manuscrite.",
            [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Galerie', onPress: () => runScan('library') },
                { text: 'Appareil photo', onPress: () => runScan('camera') },
            ]
        );
    };

    const handleConfirmScanReview = () => {
        const parsed = parseRecipeText(scanReviewText, { scope: scanScope });
        setScanReviewVisible(false);
        if (hasExistingContentForScope(scanScope)) {
            showAlert('Remplacer le formulaire ?', 'Des champs contiennent déjà du texte — le scan va les remplacer.', [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Remplacer', style: 'destructive', onPress: () => applyScanResult(parsed) },
            ]);
        } else {
            applyScanResult(parsed);
        }
    };

    const handleSave = async () => {
        const cleanIngredients = ingredients
            .filter((i) => i.name.trim())
            .map((i) => ({ ingredientName: i.name.trim(), unit: i.unit.trim(), quantity: parseFloat(i.quantity) }));
        const cleanSteps = steps.map((s) => s.value.trim()).filter(Boolean);

        if (!title.trim()) {
            setError('Le titre de la recette est obligatoire.');
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
            const created = await recipeApi.create(token, {
                title: title.trim(),
                difficulty,
                type: type === 'Non défini' ? null : type,
                diet: diet === 'Aucun' ? null : diet,
                preparationTime: parseInt(time, 10) || null,
                servings: parseInt(servings, 10) || null,
                ingredients: cleanIngredients,
                steps: cleanSteps,
            });

            if (images.length > 0) {
                try {
                    await recipeApi.addImages(token, created.id, images);
                } catch (imageErr) {
                    console.error('Échec de l\'envoi des photos:', imageErr);
                    showAlert(
                        'Recette créée',
                        `La recette a été créée mais l'envoi des photos a échoué : ${imageErr.message || imageErr}`
                    );
                }
            }

            navigation?.goBack();
        } catch (err) {
            setError(err.message || 'Impossible de créer la recette.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Nouvelle Recette</Text>
                <Text style={styles.subtitle}>
                    Partagez votre expertise culinaire avec la communauté.
                </Text>

                <TouchableOpacity
                    style={[styles.scanButton, scanning && styles.buttonDisabled]}
                    activeOpacity={0.85}
                    onPress={handleScanRecipe}
                    disabled={scanning}
                >
                    {scanning ? (
                        <ActivityIndicator color={colors.primaryDark} />
                    ) : (
                        <>
                            <Icon name="camera" size={16} color={colors.primaryDark} style={{ marginRight: 8 }} />
                            <Text style={styles.scanButtonText}>Scanner une recette (remplissage automatique)</Text>
                        </>
                    )}
                </TouchableOpacity>

                <MultiPhotoPicker
                    images={images}
                    onAdd={handlePickPhotos}
                    onRemove={handleRemovePhoto}
                    maxCount={MAX_IMAGES}
                />

                <View style={styles.card}>
                    <FormInput
                        label="Titre de la recette"
                        placeholder="ex: Lasagnes à la Bolognaise"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <View style={styles.row}>
                        <FormInput
                            label="Temps de préparation (min)"
                            icon="clock"
                            keyboardType="number-pad"
                            placeholder="ex: 45"
                            value={time}
                            onChangeText={setTime}
                            containerStyle={styles.halfField}
                        />
                        <FormInput
                            label="Nombre de personnes"
                            icon="users"
                            keyboardType="number-pad"
                            placeholder="ex: 4"
                            value={servings}
                            onChangeText={setServings}
                            containerStyle={styles.halfField}
                        />
                    </View>
                    <View style={styles.row}>
                        <SelectField
                            label="Difficulté"
                            value={difficulty}
                            options={DIFFICULTIES}
                            onSelect={setDifficulty}
                            containerStyle={styles.halfField}
                        />
                        <SelectField
                            label="Type"
                            value={type}
                            options={TYPES}
                            onSelect={setType}
                            containerStyle={styles.halfField}
                        />
                    </View>
                    <SelectField label="Régime" value={diet} options={DIETS} onSelect={setDiet} />
                </View>

                <SectionCard icon="coffee" title="Ingrédients">
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
                    <DashedButton label="Ajouter un ingrédient" onPress={addIngredient} />
                </SectionCard>

                <SectionCard icon="list" title="Étapes">
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
                    <DashedButton icon="edit-3" label="Ajouter une étape" onPress={addStep} />
                </SectionCard>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    activeOpacity={0.85}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={colors.textOnDark} />
                    ) : (
                        <>
                            <Icon name="save" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                            <Text style={typography.button}>Enregistrer la recette</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <Modal
                visible={scanReviewVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setScanReviewVisible(false)}
            >
                <View style={styles.overlay}>
                    <View style={styles.reviewCard}>
                        <Text style={styles.pickerTitle}>Texte reconnu</Text>

                        <ScrollView
                            style={styles.reviewScroll}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.reviewHint}>
                                Supprimez les lignes qui ne font pas partie de la recette (menus, publicités,
                                boutons...) avant de continuer.
                            </Text>

                            <Text style={styles.scopeLabel}>Cette photo contient :</Text>
                            <View style={styles.scopeRow}>
                                {SCAN_SCOPES.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[styles.scopeChip, scanScope === option.value && styles.scopeChipActive]}
                                        activeOpacity={0.8}
                                        onPress={() => setScanScope(option.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.scopeChipText,
                                                scanScope === option.value && styles.scopeChipTextActive,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={styles.reviewInput}
                                multiline
                                textAlignVertical="top"
                                value={scanReviewText}
                                onChangeText={setScanReviewText}
                            />
                        </ScrollView>

                        <View style={styles.reviewButtonRow}>
                            <TouchableOpacity
                                style={[styles.reviewButton, styles.reviewButtonSecondary]}
                                activeOpacity={0.85}
                                onPress={() => setScanReviewVisible(false)}
                            >
                                <Text style={styles.reviewButtonSecondaryText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.reviewButton, styles.reviewButtonPrimary]}
                                activeOpacity={0.85}
                                onPress={handleConfirmScanReview}
                            >
                                <Text style={typography.button}>Continuer</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primarySoft + '33',
        borderWidth: 1,
        borderColor: colors.primarySoft,
        borderRadius: radius.pill,
        height: 48,
        marginBottom: spacing.md,
    },
    scanButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primaryDark,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
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
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.pill,
        height: 54,
        marginTop: spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    reviewCard: {
        width: '100%',
        maxWidth: 420,
        maxHeight: '85%',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    pickerTitle: {
        ...typography.h2,
        marginBottom: spacing.xs,
    },
    reviewScroll: {
        flex: 1,
    },
    reviewHint: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        lineHeight: 18,
    },
    scopeLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    scopeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    scopeChip: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 6,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    scopeChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    scopeChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    scopeChipTextActive: {
        color: colors.textOnDark,
    },
    reviewInput: {
        minHeight: 220,
        maxHeight: 320,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.sm,
        fontSize: 14,
        color: colors.textPrimary,
        backgroundColor: colors.background,
    },
    reviewButtonRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    reviewButton: {
        flex: 1,
        height: 46,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewButtonPrimary: {
        backgroundColor: colors.primary,
    },
    reviewButtonSecondary: {
        backgroundColor: colors.cardMuted,
    },
    reviewButtonSecondaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSecondary,
    },
});
