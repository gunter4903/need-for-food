import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function SettingsRow({ icon, label, danger, onPress, isLast }) {
    return (
        <TouchableOpacity
            style={[styles.row, !isLast && styles.divider]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
                <Icon name={icon} size={16} color={danger ? colors.danger : colors.primaryDark} />
            </View>
            <Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
            <Icon name="chevron-right" size={18} color={danger ? colors.danger : colors.textSecondary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: radius.pill,
        backgroundColor: colors.cardMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    iconWrapDanger: {
        backgroundColor: '#FBEAE9',
    },
    label: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    labelDanger: {
        color: colors.danger,
    },
});