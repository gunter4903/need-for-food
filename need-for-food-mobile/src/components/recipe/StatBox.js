import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing } from '../../constants/theme';

export default function StatBox({ icon, label, value, isLast }) {
    return (
        <View style={[styles.box, !isLast && styles.divider]}>
            <Icon name={icon} size={16} color={colors.primary} />
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    divider: {
        borderRightWidth: 1,
        borderRightColor: colors.border,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        marginTop: 4,
    },
    value: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 2,
    },
});