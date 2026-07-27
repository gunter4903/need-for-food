import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import PhotoPicker from '../../components/common/PhotoPicker';
import FormInput from '../../components/common/FormInput';
import SelectField from '../../components/recipe/SelectField';
import SectionCard from '../../components/recipe/SectionCard';
import IngredientInputRow from '../../components/recipe/IngredientInputRow';
import { EditableStepRow } from '../../components/recipe/EditableListRow';
import DashedButton from '../../components/recipe/DashedButton';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as recipeApi from '../../api/recipeApi';

const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile'];
const TYPES = ['Non défini', 'Entrée', 'Plat', 'Dessert', 'Boisson', 'Apéritif'];
const DIETS = ['Aucun', 'Végétarien', 'Végan', 'Sans gluten', 'Sans lactose'];

let nextId = 1;
const makeId = () => `item-${nextId++}`;

export default function AddRecipeScreen({ navigation }) {
    const { token } = useAuth();
    const [photoUri, setPhotoUri] = useState(null);
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [difficulty, setDifficulty] = useState('Facile');
    const [type, setType] = useState('Non défini');
    const [diet, setDiet] = useState('Aucun');
    const [ingredients, setIngredients] = useState([{ id: makeId(), name: '', quantity: '', unit: '' }]);
    const [steps, setSteps] = useState([{ id: makeId(), value: '' }]);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

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

    const handlePickPhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError("L'accès à vos photos est nécessaire pour ajouter une image.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            base64: true,
            quality: 0.5,
            allowsEditing: true,
            aspect: [4, 3],
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setPhotoUri(`data:image/jpeg;base64,${asset.base64}`);
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
            await recipeApi.create(token, {
                title: title.trim(),
                difficulty,
                type: type === 'Non défini' ? null : type,
                diet: diet === 'Aucun' ? null : diet,
                imageUrl: photoUri,
                preparationTime: parseInt(time, 10) || null,
                ingredients: cleanIngredients,
                steps: cleanSteps,
            });
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

                <PhotoPicker imageUri={photoUri} onPress={handlePickPhoto} />

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
                            placeholder="45"
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
});
