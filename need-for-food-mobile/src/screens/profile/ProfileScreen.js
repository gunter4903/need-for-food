import React, { useCallback, useState } from 'react';
import {
    ScrollView,
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, typography, radius } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import PreferenceTag from '../../components/profile/PreferenceTag';
import RecipeCard from '../../components/common/RecipeCard';
import SettingsRow from '../../components/profile/SettingsRow';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as recipeApi from '../../api/recipeApi';

const PREFERENCES = [
    { key: 'vegan', label: 'Vegan', icon: '🌱' },
    { key: 'gluten-free', label: 'Gluten-free', icon: '🌾' },
];

function toCard(recipe) {
    return {
        id: recipe.id,
        title: recipe.title,
        time: recipe.preparationTime != null ? `${recipe.preparationTime} min` : '—',
        image: recipe.imageUrl ? { uri: recipe.imageUrl } : images.imagePlaceholder,
    };
}

export default function ProfileScreen({ navigation }) {
    const { user, token, logout } = useAuth();
    const [myRecipes, setMyRecipes] = useState([]);
    const [loadingRecipes, setLoadingRecipes] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                try {
                    const recipes = await recipeApi.getMine(token);
                    if (!cancelled) setMyRecipes(recipes.map(toCard));
                } catch {
                    // silencieux : la section "Mes Recettes" reste vide en cas d'erreur
                } finally {
                    if (!cancelled) setLoadingRecipes(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [token])
    );

    const handleLogout = () => {
        logout();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Image source={images.appIcon} style={styles.logo}/>
                    <Text style={styles.headerTitle}>Need for Food</Text>
                </View>

                {/* Avatar + nom */}
                <View style={styles.profileBlock}>
                    <View style={styles.avatarWrap}>
                        <Image
                            source={user?.avatarUrl ? { uri: user.avatarUrl } : images.avatar}
                            style={styles.avatar}
                        />
                        <TouchableOpacity
                            style={styles.editBadge}
                            activeOpacity={0.8}
                            onPress={() => navigation?.navigate('ModifierProfil')}
                        >
                            <Icon name="edit-2" size={13} color={colors.textOnDark} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.name}>{user?.username}</Text>
                    <Text style={styles.bio}>{user?.bio || 'Ajoutez une bio depuis votre profil'}</Text>
                </View>

                {/* Préférences alimentaires */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={typography.h2}>Préférences alimentaires</Text>
                    <TouchableOpacity style={styles.settingsIconButton}>
                        <Icon name="settings" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.preferencesRow}>
                    {PREFERENCES.map((pref) => (
                        <PreferenceTag key={pref.key} label={pref.label} icon={pref.icon} />
                    ))}
                    <TouchableOpacity style={styles.addTag} activeOpacity={0.8}>
                        <Icon name="plus" size={13} color={colors.textPrimary} />
                        <Text style={styles.addTagLabel}>Ajouter</Text>
                    </TouchableOpacity>
                </View>

                {/* Mes recettes */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={typography.h2}>Mes Recettes</Text>
                    <TouchableOpacity>
                        <Text style={styles.linkText}
                              onPress={()=> navigation?.navigate('ChercherRecettes')}>Voir tout</Text>
                    </TouchableOpacity>
                </View>
                {loadingRecipes ? (
                    <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.lg }} />
                ) : myRecipes.length === 0 ? (
                    <TouchableOpacity
                        style={styles.emptyRecipes}
                        activeOpacity={0.8}
                        onPress={() => navigation?.navigate('AjouterRecette')}
                    >
                        <Icon name="plus-circle" size={20} color={colors.primary} />
                        <Text style={styles.emptyRecipesText}>Ajoutez votre première recette</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.recipesGrid}>
                        <RecipeCard
                            recipe={myRecipes[0]}
                            style={styles.bigRecipeCard}
                            onPress={() => navigation?.navigate('DetailsRecette', { id: myRecipes[0].id })}
                        />
                        {myRecipes.length > 1 ? (
                            <View style={styles.recipesColumn}>
                                {myRecipes.slice(1, 3).map((recipe) => (
                                    <RecipeCard
                                        key={recipe.id}
                                        recipe={recipe}
                                        style={styles.smallRecipeCard}
                                        onPress={() => navigation?.navigate('DetailsRecette', { id: recipe.id })}
                                    />
                                ))}
                            </View>
                        ) : null}
                    </View>
                )}

                {/* Paramètres */}
                <Text style={[typography.h2, styles.sectionTitle]}>Paramètres</Text>
                <View style={styles.settingsCard}>
                    <SettingsRow
                        icon="user"
                        label="Mon Compte"
                        onPress={() => navigation?.navigate('ModifierProfil')}
                    />
                    <SettingsRow
                        icon="lock"
                        label="Confidentialité"
                        onPress={() => navigation?.navigate('Confidentialite')}
                    />
                    <SettingsRow
                        icon="log-out"
                        label="Déconnexion"
                        danger
                        isLast
                        onPress={handleLogout}
                    />
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
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    headerLogoEmoji: {
        fontSize: 20,
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primaryDark,
    },
    profileBlock: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarWrap: {
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    name: {
        ...typography.h1,
        fontSize: 22,
    },
    bio: {
        ...typography.caption,
        marginTop: 2,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    settingsIconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    preferencesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.lg,
    },
    addTag: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        paddingVertical: 8,
        paddingHorizontal: spacing.md,
    },
    addTagLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 4,
    },
    emptyRecipes: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingVertical: spacing.lg,
        marginBottom: spacing.lg,
    },
    emptyRecipesText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: spacing.sm,
    },
    recipesGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    bigRecipeCard: {
        flex: 1,
        height: 234,
    },
    recipesColumn: {
        flex: 1,
        gap: spacing.sm,
    },
    smallRecipeCard: {
        flex: 1,
    },
    sectionTitle: {
        marginBottom: spacing.sm,
    },
    settingsCard: {
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
    },
    logo: {
        width: 36,
        height: 36,
    },
});