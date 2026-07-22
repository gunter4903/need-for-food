import React, { useState } from 'react';
import {
    ScrollView,
    ImageBackground,
    View,
    Text,
    TouchableOpacity,
    StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import StatBox from '../../components/recipe/StatBox';
import CheckboxRow from '../../components/common/CheckboxRow';
import StepTimelineItem from '../../components/recipe/StepTimelineItem';
import BottomNav from '../../components/common/BottomNav';

const RECIPE = {
    id: 'pates-au-pesto',
    title: 'Pâtes au Pesto',
    tag: 'Végétarien',
    image: images.patesAuPestoHero,
    time: '20 min',
    difficulty: 'Facile',
    calories: '450 kcal',
    servings: 4,
    ingredients: [
        { id: 'i1', label: '400g de Spaghetti de blé dur', tag: 'Indispensable' },
        { id: 'i2', label: '2 bouquets de Basilic frais', tag: 'Frais' },
        { id: 'i3', label: '50g de Pignons de pin', tag: 'Torréfiés' },
        { id: 'i4', label: '60g de Parmesan râpé', tag: 'AOC' },
        { id: 'i5', label: "15cl d'Huile d'olive extra vierge", tag: 'Bio' },
    ],
    steps: [
        "Portez une grande casserole d'eau salée à ébullition. Plongez les pâtes et faites-les cuire selon le temps indiqué sur le paquet pour une cuisson al dente.",
        "Pendant ce temps, lavez le basilic et séchez-le. Mixez-le avec les pignons de pin, l'ail (optionnel) et le parmesan. Ajoutez l'huile d'olive en filet jusqu'à obtenir une texture onctueuse.",
        "Égouttez les pâtes en réservant une petite louche d'eau de cuisson. Mélangez les pâtes au pesto dans un grand plat, en ajoutant un peu d'eau de cuisson pour détendre la sauce.",
    ],
};

export default function RecipeDetailScreen({ navigation }) {
    const [checked, setChecked] = useState({});

    const toggleIngredient = (id) => {
        setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Hero */}
                <ImageBackground source={RECIPE.image} style={styles.hero}>
                    <View style={styles.heroHeader}>
                        <TouchableOpacity
                            style={styles.heroIconButton}
                            onPress={() => navigation?.goBack()}
                        >
                            <Icon name="arrow-left" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.heroTitle}>Need for Food</Text>
                        <TouchableOpacity
                            style={styles.heroAvatarButton}
                            onPress={() => navigation?.navigate('Profil')}
                        >
                            <Image
                                source={images.avatar}
                                style={styles.avatar}
                            />
                        </TouchableOpacity>
                    </View>
                </ImageBackground>

                <View style={styles.contentBlock}>
                    <View style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>{RECIPE.tag}</Text>
                    </View>
                    <Text style={styles.title}>{RECIPE.title}</Text>

                    <View style={styles.statsCard}>
                        <StatBox icon="clock" label="TEMPS" value={RECIPE.time} />
                        <StatBox icon="bar-chart-2" label="DIFFICULTÉ" value={RECIPE.difficulty} />
                        <StatBox icon="zap" label="CALORIES" value={RECIPE.calories} isLast />
                    </View>

                    <View style={styles.sectionHeaderRow}>
                        <Text style={typography.h2}>Ingrédients</Text>
                        <Text style={styles.servings}>{RECIPE.servings} personnes</Text>
                    </View>
                    {RECIPE.ingredients.map((ingredient) => (
                        <CheckboxRow
                            key={ingredient.id}
                            label={ingredient.label}
                            tag={ingredient.tag}
                            checked={!!checked[ingredient.id]}
                            onToggle={() => toggleIngredient(ingredient.id)}
                        />
                    ))}

                    <TouchableOpacity style={styles.addToListButton} activeOpacity={0.85}>
                        <Icon name="shopping-cart" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                        <Text style={typography.button}>Ajouter à la liste de courses</Text>
                    </TouchableOpacity>

                    <Text style={[typography.h2, styles.stepsTitle]}>Étapes de préparation</Text>
                    {RECIPE.steps.map((step, index) => (
                        <StepTimelineItem
                            key={index}
                            number={index + 1}
                            content={step}
                            isLast={index === RECIPE.steps.length - 1}
                        />
                    ))}

                    <TouchableOpacity
                        style={styles.editButton}
                        activeOpacity={0.85}
                        onPress={() => navigation?.navigate('ModifierRecette', { id: RECIPE.id })}
                    >
                        <Icon name="edit-2" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                        <Text style={typography.button}>Modifier cette recette</Text>
                    </TouchableOpacity>
                </View>
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
        paddingBottom: spacing.xl,
    },
    hero: {
        width: '100%',
        height: 260,
        justifyContent: 'flex-start',
    },
    heroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    heroIconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroAvatarButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: colors.primarySoft,
    },
    heroTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryDark,
        backgroundColor: 'rgba(255,255,255,0.85)',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    contentBlock: {
        paddingHorizontal: spacing.lg,
        marginTop: -spacing.lg,
    },
    tagBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primarySoft,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
        marginBottom: spacing.xs,
    },
    tagBadgeText: {
        color: colors.textOnDark,
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        ...typography.h1,
        fontSize: 26,
        marginBottom: spacing.md,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    servings: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    addToListButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 50,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    stepsTitle: {
        marginBottom: spacing.md,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 52,
        marginTop: spacing.sm,
    },
});