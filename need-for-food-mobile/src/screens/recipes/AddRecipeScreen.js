import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import PhotoPicker from '../../components/common/PhotoPicker';
import FormInput from '../../components/common/FormInput';
import SelectField from '../../components/recipe/SelectField';
import SectionCard from '../../components/recipe/SectionCard';
import IngredientInputRow from '../../components/recipe/IngredientInputRow';
import DashedButton from '../../components/recipe/DashedButton';
import BottomNav from '../../components/common/BottomNav';

let nextId = 1;
const makeId = () => `item-${nextId++}`;

export default function AddRecipeScreen({ navigation }) {
    const [photoUri, setPhotoUri] = useState(null);
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('45 min');
    const [difficulty, setDifficulty] = useState('Facile');
    const [ingredients, setIngredients] = useState([{ id: makeId(), value: '' }]);
    const [steps, setSteps] = useState([{ id: makeId(), value: '' }]);

    const addIngredient = () => setIngredients((prev) => [...prev, { id: makeId(), value: '' }]);
    const updateIngredient = (id, value) =>
        setIngredients((prev) => prev.map((i) => (i.id === id ? { ...i, value } : i)));

    const addStep = () => setSteps((prev) => [...prev, { id: makeId(), value: '' }]);
    const updateStep = (id, value) =>
        setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, value } : s)));

    const handleSave = () => {
        // TODO: créer recette (title, time, difficulty, ingredients, steps, photoUri)
        navigation?.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Nouvelle Recette</Text>
                <Text style={styles.subtitle}>
                    Partagez votre expertise culinaire avec la communauté.
                </Text>

                <PhotoPicker imageUri={photoUri} onPress={() => {/* TODO: ouvrir le sélecteur d'image */}} />

                <View style={styles.card}>
                    <FormInput
                        label="Titre de la recette"
                        placeholder="ex: Lasagnes à la Bolognaise"
                        value={title}
                        onChangeText={setTitle}
                    />
                    <View style={styles.row}>
                        <FormInput
                            label="Temps de préparation"
                            icon="clock"
                            value={time}
                            onChangeText={setTime}
                            containerStyle={styles.halfField}
                        />
                        <SelectField
                            label="Difficulté"
                            value={difficulty}
                            onPress={() => {/* TODO: ouvrir le sélecteur Facile / Moyen / Difficile */}}
                            containerStyle={styles.halfField}
                        />
                    </View>
                </View>

                <SectionCard icon="coffee" title="Ingrédients">
                    {ingredients.map((ingredient, index) => (
                        <IngredientInputRow
                            key={ingredient.id}
                            index={index + 1}
                            value={ingredient.value}
                            onChangeText={(text) => updateIngredient(ingredient.id, text)}
                            placeholder="Ingrédient (ex: Farine)"
                        />
                    ))}
                    <DashedButton label="Ajouter un ingrédient" onPress={addIngredient} />
                </SectionCard>

                <SectionCard icon="list" title="Étapes">
                    {steps.map((step, index) => (
                        <View key={step.id} style={styles.stepRow}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>{index + 1}</Text>
                            </View>
                            <FormInput
                                placeholder="Décrivez cette étape de préparation..."
                                multiline
                                numberOfLines={3}
                                value={step.value}
                                onChangeText={(text) => updateStep(step.id, text)}
                                containerStyle={styles.stepInput}
                            />
                        </View>
                    ))}
                    <DashedButton icon="edit-3" label="Ajouter une étape" onPress={addStep} />
                </SectionCard>

                <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
                    <Icon name="save" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                    <Text style={typography.button}>Enregistrer la recette</Text>
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
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
        marginTop: 2,
    },
    stepBadgeText: {
        color: colors.textOnDark,
        fontSize: 12,
        fontWeight: '700',
    },
    stepInput: {
        flex: 1,
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
});