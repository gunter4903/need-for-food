import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export default function CategoryChip({ label, emoji, active, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            onPress={onPress}
        >
            {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
            <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: colors.cardMuted,
        marginRight: spacing.sm,
    },
    chipActive: {
        backgroundColor: colors.primarySoft,
    },
    emoji: {
        fontSize: 14,
        marginRight: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    labelActive: {
        color: colors.textOnDark,
    },
});