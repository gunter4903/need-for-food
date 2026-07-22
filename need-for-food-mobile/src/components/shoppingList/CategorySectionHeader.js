import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/theme';

export default function CategorySectionHeader({ emoji, label }) {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={styles.label}>{label}</Text>
            </View>
            <View style={styles.divider} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    emoji: {
        fontSize: 14,
        marginRight: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primaryDark,
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
});