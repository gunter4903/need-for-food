import React from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function RecipePickRow({
                                           recipe,
                                           selected,
                                           busy,
                                           onPress,
                                           servings,
                                           onServingsChange,
                                           servingsEditable = true,
                                       }) {
    const showServingsStepper =
        servingsEditable && recipe.servings != null && recipe.servings > 0 && !!onServingsChange;
    const currentServings = servings ?? recipe.servings;

    return (
        <View style={styles.container}>
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

            {showServingsStepper ? (
                <View style={styles.servingsRow}>
                    <Text style={styles.servingsLabel}>
                        Pour {currentServings} {currentServings > 1 ? 'personnes' : 'personne'}
                    </Text>
                    <View style={styles.servingsStepper}>
                        <TouchableOpacity
                            style={styles.servingsStepButton}
                            activeOpacity={0.7}
                            disabled={currentServings <= 1}
                            onPress={() => onServingsChange(Math.max(1, currentServings - 1))}
                        >
                            <Icon name="minus" size={14} color={currentServings <= 1 ? colors.border : colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.servingsStepValue}>{currentServings}</Text>
                        <TouchableOpacity
                            style={styles.servingsStepButton}
                            activeOpacity={0.7}
                            onPress={() => onServingsChange(currentServings + 1)}
                        >
                            <Icon name="plus" size={14} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
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
    servingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
    },
    servingsLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    servingsStepper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    servingsStepButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    servingsStepValue: {
        minWidth: 22,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
        marginHorizontal: spacing.xs,
    },
});
