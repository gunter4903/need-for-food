import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import PreferenceTagList from '../../components/profile/PreferenceTagList';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import * as preferenceApi from '../../api/preferenceApi';

export default function PreferencesScreen({ navigation }) {
    const { token } = useAuth();
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [maxTime, setMaxTime] = useState('');
    const [savingMaxTime, setSavingMaxTime] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            (async () => {
                setLoading(true);
                try {
                    const data = await preferenceApi.getMine(token);
                    if (!cancelled) {
                        setPreferences(data);
                        setMaxTime(data.maxPreparationTime != null ? String(data.maxPreparationTime) : '');
                    }
                } catch (err) {
                    if (!cancelled) setError(err.message || 'Impossible de charger vos préférences.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();

            return () => {
                cancelled = true;
            };
        }, [token])
    );

    const updatePreferences = async (partial) => {
        const next = { ...preferences, ...partial };
        const response = await preferenceApi.updateMine(token, {
            diet: next.diet || [],
            allergies: next.allergies || [],
            dislikedIngredients: next.dislikedIngredients || [],
            favoriteRecipeTypes: next.favoriteRecipeTypes || [],
            maxPreparationTime: next.maxPreparationTime ?? null,
        });
        setPreferences(response);
    };

    const handleSaveMaxTime = async () => {
        setError('');
        setSavingMaxTime(true);
        try {
            const parsed = parseInt(maxTime, 10);
            await updatePreferences({ maxPreparationTime: Number.isNaN(parsed) ? null : parsed });
        } catch (err) {
            setError(err.message || "Impossible d'enregistrer.");
        } finally {
            setSavingMaxTime(false);
        }
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Mes préférences</Text>
                <Text style={styles.subtitle}>
                    Utilisées pour vous suggérer des recettes plus pertinentes.
                </Text>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <PreferenceTagList
                    label="Régime alimentaire"
                    items={preferences?.diet || []}
                    placeholder="Ex: Végétarien"
                    onAdd={(value) => updatePreferences({ diet: [...(preferences?.diet || []), value] })}
                    onRemove={(value) => updatePreferences({ diet: (preferences?.diet || []).filter((v) => v !== value) })}
                />

                <PreferenceTagList
                    label="Allergies"
                    items={preferences?.allergies || []}
                    placeholder="Ex: Arachide"
                    onAdd={(value) => updatePreferences({ allergies: [...(preferences?.allergies || []), value] })}
                    onRemove={(value) => updatePreferences({ allergies: (preferences?.allergies || []).filter((v) => v !== value) })}
                />

                <PreferenceTagList
                    label="Ingrédients détestés"
                    items={preferences?.dislikedIngredients || []}
                    placeholder="Ex: Coriandre"
                    onAdd={(value) => updatePreferences({ dislikedIngredients: [...(preferences?.dislikedIngredients || []), value] })}
                    onRemove={(value) => updatePreferences({ dislikedIngredients: (preferences?.dislikedIngredients || []).filter((v) => v !== value) })}
                />

                <PreferenceTagList
                    label="Types de recettes favoris"
                    items={preferences?.favoriteRecipeTypes || []}
                    placeholder="Ex: Dessert"
                    onAdd={(value) => updatePreferences({ favoriteRecipeTypes: [...(preferences?.favoriteRecipeTypes || []), value] })}
                    onRemove={(value) => updatePreferences({ favoriteRecipeTypes: (preferences?.favoriteRecipeTypes || []).filter((v) => v !== value) })}
                />

                <Text style={styles.sectionTitle}>Temps de préparation max</Text>
                <View style={styles.maxTimeRow}>
                    <FormInput
                        icon="clock"
                        placeholder="Ex: 30"
                        keyboardType="number-pad"
                        value={maxTime}
                        onChangeText={setMaxTime}
                        containerStyle={styles.maxTimeField}
                    />
                    <TouchableOpacity
                        style={styles.saveButton}
                        activeOpacity={0.85}
                        onPress={handleSaveMaxTime}
                        disabled={savingMaxTime}
                    >
                        {savingMaxTime ? (
                            <ActivityIndicator size="small" color={colors.textOnDark} />
                        ) : (
                            <Text style={styles.saveButtonLabel}>Enregistrer</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={styles.hint}>En minutes. Laissez vide pour ne fixer aucune limite.</Text>
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
        marginBottom: spacing.lg,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    maxTimeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    maxTimeField: {
        flex: 1,
    },
    saveButton: {
        height: 50,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textOnDark,
    },
    hint: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});
