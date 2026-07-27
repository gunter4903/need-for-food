import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function RecipePickRow({ recipe, selected, busy, onPress }) {
    return (
        <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress} disabled={busy}>
            <View style={styles.left}>
                <Text style={styles.title} numberOfLines={1}>{recipe.title}</Text>
                <Text style={styles.meta}>{recipe.ingredients.length} ingrédients</Text>
            </View>
            {busy ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Icon name={selected ? 'check-circle' : 'plus-circle'} size={20} color={selected ? colors.success : colors.primary} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    left: {
        flex: 1,
        marginRight: spacing.sm,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    meta: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
});
