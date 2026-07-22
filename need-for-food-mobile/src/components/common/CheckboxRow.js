import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function CheckboxRow({
                                        label,
                                        subtitle,
                                        tag,
                                        checked,
                                        onToggle,
                                        onDelete,
                                        style,
                                    }) {
    return (
        <View style={[styles.row, style]}>
            <TouchableOpacity
                style={styles.left}
                activeOpacity={0.7}
                onPress={onToggle}
            >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked ? <Icon name="check" size={13} color={colors.textOnDark} /> : null}
                </View>
                <View style={styles.textBlock}>
                    <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                </View>
            </TouchableOpacity>

            {onDelete ? (
                <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="x" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            ) : tag ? (
                <Text style={styles.tag}>{tag}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
    },
    textBlock: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    labelChecked: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    tag: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
    },
});