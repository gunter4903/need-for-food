import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function IngredientInputRow({
                                                index,
                                                name,
                                                quantity,
                                                unit,
                                                onChangeName,
                                                onChangeQuantity,
                                                onChangeUnit,
                                                onRemove,
                                                placeholder = 'Ingrédient (ex: Farine)',
                                            }) {
    return (
        <View style={styles.row}>
            <View style={styles.topRow}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{index}</Text>
                </View>
                <TextInput
                    style={styles.nameInput}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={onChangeName}
                />
                {onRemove ? (
                    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon name="x" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                ) : null}
            </View>
            <View style={styles.bottomRow}>
                <TextInput
                    style={styles.quantityInput}
                    placeholder="Quantité"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={onChangeQuantity}
                />
                <TextInput
                    style={styles.unitInput}
                    placeholder="Unité (g, ml, pièce...)"
                    placeholderTextColor={colors.textSecondary}
                    value={unit}
                    onChangeText={onChangeUnit}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        marginBottom: spacing.sm,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
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
    nameInput: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        fontSize: 14,
        color: colors.textPrimary,
        backgroundColor: colors.card,
        marginRight: spacing.sm,
    },
    bottomRow: {
        flexDirection: 'row',
        marginLeft: 42,
        gap: spacing.sm,
    },
    quantityInput: {
        width: 90,
        height: 40,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.sm,
        fontSize: 13,
        color: colors.textPrimary,
        backgroundColor: colors.card,
    },
    unitInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.sm,
        fontSize: 13,
        color: colors.textPrimary,
        backgroundColor: colors.card,
    },
});
