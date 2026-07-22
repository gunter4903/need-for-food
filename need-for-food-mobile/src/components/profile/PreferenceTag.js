import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export default function PreferenceTag({ label, icon }) {
    return (
        <View style={styles.tag}>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={styles.label}>{label}</Text>
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
});