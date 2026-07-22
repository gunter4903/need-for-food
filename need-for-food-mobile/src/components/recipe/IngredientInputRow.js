import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export default function IngredientInputRow({ index, value, onChangeText, placeholder }) {
    return (
        <View style={styles.row}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{index}</Text>
            </View>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    badge: {
        width: 34,
        height: 44,
        borderRadius: radius.sm,
        backgroundColor: colors.cardMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    input: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        fontSize: 14,
        color: colors.textPrimary,
        backgroundColor: colors.card,
    },
});