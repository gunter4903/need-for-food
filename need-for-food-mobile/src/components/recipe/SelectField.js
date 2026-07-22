import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function SelectField({ label, value, onPress, containerStyle }) {
    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={onPress}>
                <Text style={styles.value}>{value}</Text>
                <Icon name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 50,
    },
    value: {
        fontSize: 15,
        color: colors.textPrimary,
    },
});