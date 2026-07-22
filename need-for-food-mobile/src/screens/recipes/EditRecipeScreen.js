import React, { useState } from 'react';
import {
    ScrollView,
    Image,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import SelectField from '../../components/recipe/SelectField';
import SectionCard from '../../components/recipe/SectionCard';
import { EditableListRow, EditableStepRow } from '../../components/recipe/EditableListRow';
import BottomNav from '../../components/common/BottomNav';

const INITIAL_INGREDIENTS = [
    { id: 'i1', label: '250g de Fusilli' },
    { id: 'i2', label: '100g de Pesto Basilic' },
    { id: 'i3', label: 'Parmesan râpé' },
];

const STEPS = [
    'Cuire les pâtes al dente dans l\'eau bouillante salée.',
    'Mélanger les pâtes avec le pesto et un peu d\'eau de cuisson.',
];

export default function EditRecipeScreen({ route, navigation }) {
    const [name, setName] = useState('Pâtes au Pesto');
    const [time, setTime] = useState('15');
    const [difficulty, setDifficulty] = useState('Facile');
    const [ingredients, setIngredients] = useState(INITIAL_INGREDIENTS);

    const removeIngredient = (id) =>
        setIngredients((prev) => prev.filter((i) => i.id !== id));

    const handleUpdate = () => {
        // TODO: modifications
        navigation?.goBack();
    };

    const handleDelete = () => {
        // TODO: confirmer puis supprimer la recette
        navigation?.navigate('Accueil');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.eyebrow}>MODIFIER LA RECETTE</Text>
                <Text style={typography.h1}>{name}</Text>

                <Image
                    source={images.patesAuPestoEdit}
                    style={styles.image}
                />

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
                            onPress={() => {/* TODO: ouvrir le sélecteur Facile / Moyen / Difficile */}}
                            containerStyle={styles.halfField}
                        />
                    </View>
                </SectionCard>

                <SectionCard icon="scissors" title="Ingrédients" onAdd={() => {/* TODO: ajouter un ingrédient */}}>
                    {ingredients.map((ingredient) => (
                        <EditableListRow
                            key={ingredient.id}
                            label={ingredient.label}
                            onDelete={() => removeIngredient(ingredient.id)}
                        />
                    ))}
                </SectionCard>

                <SectionCard icon="list" title="Étapes" onAdd={() => {/* TODO: ajouter une étape */}}>
                    {STEPS.map((step, index) => (
                        <EditableStepRow
                            key={index}
                            number={index + 1}
                            content={step}
                            isLast={index === STEPS.length - 1}
                        />
                    ))}
                </SectionCard>

                <TouchableOpacity style={styles.updateButton} activeOpacity={0.85} onPress={handleUpdate}>
                    <Icon name="save" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                    <Text style={typography.button}>Mettre à jour</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} activeOpacity={0.85} onPress={handleDelete}>
                    <Icon name="trash-2" size={16} color={colors.danger} style={{ marginRight: 8 }} />
                    <Text style={styles.deleteLabel}>Supprimer</Text>
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
    eyebrow: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    image: {
        width: '100%',
        height: 170,
        borderRadius: radius.lg,
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
    updateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.pill,
        height: 52,
        marginTop: spacing.sm,
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