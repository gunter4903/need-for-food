import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export default function FilterTabBar({ tabs, active, onChange }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.container}
        >
            {tabs.map((tab) => {
                const isActive = tab === active;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, isActive && styles.tabActive]}
                        activeOpacity={0.8}
                        onPress={() => onChange(tab)}
                    >
                        <Text style={[styles.label, isActive && styles.labelActive]}>{tab}</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: colors.cardMuted,
        marginRight: spacing.sm,
    },
    tabActive: {
        backgroundColor: colors.primarySoft,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    labelActive: {
        color: colors.textOnDark,
    },
});