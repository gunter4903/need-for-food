import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import BottomNav from '../../components/common/BottomNav';

function Section({ icon, title, children }) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Icon name={icon} size={16} color={colors.primaryDark} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <Text style={styles.sectionBody}>{children}</Text>
        </View>
    );
}

export default function PrivacyScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Confidentialité</Text>
                <Text style={styles.subtitle}>
                    Ce que Need for Food fait de vos données, en clair.
                </Text>

                <Section icon="database" title="Données collectées">
                    E-mail, nom d'utilisateur, mot de passe (jamais stocké en clair, uniquement sous forme
                    hachée), bio et photo de profil, les recettes et listes de courses que vous créez, ainsi
                    que vos préférences alimentaires (régime, allergies, ingrédients détestés, types de
                    recettes favoris, temps de préparation maximum).
                </Section>

                <Section icon="eye" title="Qui peut voir quoi">
                    Vos listes de courses sont strictement privées : personne d'autre que vous n'y a accès.
                    Vos recettes, en revanche, sont visibles par les autres utilisateurs connectés à
                    l'application — ne partagez pas d'informations personnelles dans leurs titres ou
                    descriptions.
                </Section>

                <Section icon="sliders" title="À quoi servent vos préférences">
                    Vos préférences alimentaires ne sont utilisées que pour filtrer et trier les
                    suggestions de recettes qui vous sont proposées (exclusion des recettes contenant un
                    allergène ou un ingrédient détesté, ou dépassant votre temps de préparation maximum).
                    Elles ne sont ni partagées avec d'autres utilisateurs, ni utilisées à d'autres fins.
                </Section>

                <Section icon="lock" title="Sécurité du compte">
                    La connexion utilise un jeton d'authentification propre à votre session. Vous pouvez le
                    révoquer à tout moment en vous déconnectant. Votre mot de passe peut être changé depuis
                    "Modifier le profil".
                </Section>

                <Section icon="trash-2" title="Suppression de votre compte">
                    Vous pouvez supprimer votre compte à tout moment depuis "Modifier le profil". Cette
                    action est irréversible et supprime immédiatement votre profil, vos recettes, vos
                    listes de courses et vos préférences alimentaires.
                </Section>

                <TouchableOpacity
                    style={styles.manageButton}
                    activeOpacity={0.85}
                    onPress={() => navigation?.navigate('ModifierProfil')}
                >
                    <Icon name="user" size={16} color={colors.textOnDark} style={{ marginRight: 8 }} />
                    <Text style={typography.button}>Gérer mes données</Text>
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
        marginBottom: spacing.lg,
    },
    section: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    sectionIcon: {
        marginRight: 6,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    sectionBody: {
        fontSize: 13,
        lineHeight: 19,
        color: colors.textSecondary,
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 52,
        marginTop: spacing.sm,
    },
});
