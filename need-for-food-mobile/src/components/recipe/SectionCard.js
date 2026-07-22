import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function SectionCard({ icon, title, onAdd, children, style }) {
    return (
        <View style={[styles.card, style]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    {icon ? <Icon name={icon} size={16} color={colors.primaryDark} style={styles.icon} /> : null}
                    <Text style={styles.title}>{title}</Text>
                </View>
                {onAdd ? (
                    <TouchableOpacity onPress={onAdd} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon name="plus-circle" size={20} color={colors.primaryDark} />
                    </TouchableOpacity>
                ) : null}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
});