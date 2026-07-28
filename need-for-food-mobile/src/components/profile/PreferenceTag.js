import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function PreferenceTag({ label, icon, onRemove }) {
    return (
        <View style={styles.tag}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={styles.label}>{label}</Text>
            {onRemove ? (
                <TouchableOpacity
                    testID="preference-tag-remove"
                    onPress={onRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Icon name="x" size={12} color={colors.textOnDark} style={styles.removeIcon} />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primarySoft,
        paddingVertical: 8,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    icon: {
        fontSize: 13,
        marginRight: 6,
    },
    label: {
        color: colors.textOnDark,
        fontWeight: '700',
        fontSize: 13,
    },
    removeIcon: {
        marginLeft: 6,
    },
});
