import React, { useCallback, useState } from 'react';
import { ScrollView, View, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import RecipeCard from '../../components/common/RecipeCard';
import images from '../../../assets/images/temp/images';
import { useAuth } from '../../context/AuthContext';
import * as userApi from '../../api/userApi';
import * as recipeApi from '../../api/recipeApi';

function chunkPairs(items) {
    const pairs = [];
    for (let i = 0; i < items.length; i += 2) {
        pairs.push(items.slice(i, i + 2));
    }
    return pairs;
}

function toCard(recipe) {
    return {
        id: recipe.id,
        title: recipe.title,
        time: recipe.preparationTime != null ? `${recipe.preparationTime} min` : '—',
        image: recipe.images?.[0]?.url ? { uri: recipe.images[0].url } : images.imagePlaceholder,
        favorite: !!recipe.favorite,
    };
}

export default function FriendProfileScreen({ route, navigation }) {
    const { token } = useAuth();
    const userId = route?.params?.userId;
    const isFriend = !!route?.params?.isFriend;

    const [profile, setProfile] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    const [profileData, userRecipes] = await Promise.all([
                        userApi.getPublicProfile(token, userId),
                        isFriend ? recipeApi.getByUser(token, userId) : Promise.resolve([]),
                    ]);
                    if (cancelled) return;
                    setProfile(profileData);
                    setRecipes(userRecipes);
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger ce profil.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [token, userId, isFriend])
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} showAvatar={false} />

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : error || !profile ? (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>{error || 'Profil introuvable.'}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        <Image
                            source={profile.avatarUrl ? { uri: profile.avatarUrl } : images.avatar}
                            style={styles.avatar}
                        />
                        <Text style={styles.username}>{profile.username}</Text>
                        <Text style={styles.bio}>{profile.bio || 'Aucune bio.'}</Text>
                    </View>

                    {isFriend ? (
                        <View style={styles.recipesSection}>
                            <Text style={styles.sectionTitle}>Recettes ({recipes.length})</Text>
                            {recipes.length === 0 ? (
                                <Text style={styles.emptyText}>Aucune recette pour l'instant.</Text>
                            ) : (
                                <View style={styles.recipesGrid}>
                                    {chunkPairs(recipes).map((pair, index) => (
                                        <View key={index} style={styles.recipeRow}>
                                            {pair.map((recipe) => (
                                                <RecipeCard
                                                    key={recipe.id}
                                                    recipe={toCard(recipe)}
                                                    style={styles.recipeCard}
                                                    onPress={() => navigation?.navigate('DetailsRecette', { id: recipe.id })}
                                                />
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.hint}>Devenez amis pour voir ses recettes.</Text>
                    )}
                </ScrollView>
            )}
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
    errorText: {
        color: colors.danger,
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    content: {
        alignItems: 'center',
        paddingTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        marginBottom: spacing.md,
        borderWidth: 2,
        borderColor: colors.primarySoft,
    },
    username: {
        ...typography.h1,
        fontSize: 22,
        marginBottom: spacing.xs,
    },
    bio: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    hint: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    recipesSection: {
        paddingHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    recipesGrid: {
        gap: spacing.sm,
    },
    recipeRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    recipeCard: {
        flex: 1,
        height: 160,
    },
});
