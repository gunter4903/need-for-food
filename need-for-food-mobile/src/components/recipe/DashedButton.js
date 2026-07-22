import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function DashedButton({ icon = 'plus', label, onPress, style }) {
    return (
        <TouchableOpacity style={[styles.button, style]} activeOpacity={0.8} onPress={onPress}>
            <Icon name={icon} size={16} color={colors.primaryDark} />
            <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.primarySoft,
        borderStyle: 'dashed',
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primaryDark,
        marginLeft: 6,
    },
});