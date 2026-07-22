import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import Header from '../../components/common/Header';
import CategorySectionHeader from '../../components/shoppingList/CategorySectionHeader';
import CheckboxRow from '../../components/common/CheckboxRow';
import BottomNav from '../../components/common/BottomNav';

const SECTIONS = [
    {
        key: 'legumes',
        emoji: '🥬',
        label: 'LÉGUMES',
        items: [
            { id: 'pommes-de-terre', label: 'Pommes de terre (1kg)', subtitle: 'Rayon frais' },
            { id: 'oignons-jaunes', label: 'Oignons jaunes x3', subtitle: 'Vrac' },
        ],
    },
    {
        key: 'epicerie',
        emoji: '🏪',
        label: 'ÉPICERIE',
        items: [
            { id: 'huile-olive', label: "Huile d'olive extra vierge", subtitle: 'Rayon huiles' },
            { id: 'pates-fusilli', label: 'Pâtes Fusilli (500g)', subtitle: 'Rayon céréales' },
        ],
    },
    {
        key: 'cremerie',
        emoji: '🧈',
        label: 'CRÉMERIE',
        items: [
            { id: 'beurre-doux', label: 'Beurre doux', subtitle: 'Rayon froid' },
        ],
    },
];

export default function ShoppingListScreen({ navigation }) {
    const [checked, setChecked] = useState({});

    const toggle = (id) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

    const handleClearAll = () => setChecked({});

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} onAvatarPress={() => navigation?.navigate('Profil')} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Liste de courses</Text>
                <Text style={styles.subtitle}>
                    Organisez vos achats par rayon pour plus d'efficacité.
                </Text>

                {SECTIONS.map((section) => (
                    <React.Fragment key={section.key}>
                        <CategorySectionHeader emoji={section.emoji} label={section.label} />
                        {section.items.map((item) => (
                            <CheckboxRow
                                key={item.id}
                                label={item.label}
                                subtitle={item.subtitle}
                                checked={!!checked[item.id]}
                                onToggle={() => toggle(item.id)}
                            />
                        ))}
                    </React.Fragment>
                ))}

                <TouchableOpacity style={styles.clearButton} activeOpacity={0.8} onPress={handleClearAll}>
                    <Icon name="trash-2" size={16} color={colors.textPrimary} style={{ marginRight: 8 }} />
                    <Text style={styles.clearLabel}>Tout effacer</Text>
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
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        height: 50,
        marginTop: spacing.lg,
    },
    clearLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
    },
});