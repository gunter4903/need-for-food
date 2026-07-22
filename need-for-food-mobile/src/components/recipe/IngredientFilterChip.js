import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export function IngredientFilterChip({ label, active, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

export function SelectionTag({ label, onRemove }) {
    return (
        <TouchableOpacity style={styles.selectionTag} activeOpacity={0.8} onPress={onRemove}>
            <Text style={styles.selectionLabel}>{label}</Text>
            <Text style={styles.selectionClose}>×</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    labelActive: {
        color: colors.textOnDark,
    },
    selectionTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.pill,
        paddingVertical: 6,
        paddingHorizontal: spacing.sm,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    selectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
        marginRight: 4,
    },
    selectionClose: {
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '700',
    },
});