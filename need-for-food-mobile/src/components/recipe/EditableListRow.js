import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export function EditableListRow({ label, onDelete, draggable = true }) {
    return (
        <View style={styles.row}>
            {draggable ? (
                <Icon name="menu" size={16} color={colors.textSecondary} style={styles.handle} />
            ) : null}
            <Text style={styles.label} numberOfLines={1}>
                {label}
            </Text>
            <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="x" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
        </View>
    );
}

export function EditableStepRow({ number, content, isLast }) {
    return (
        <View style={styles.stepRow}>
            <View style={styles.stepMarkerColumn}>
                <View style={styles.stepMarker}>
                    <Text style={styles.stepMarkerText}>{number}</Text>
                </View>
                {!isLast ? <View style={styles.stepLine} /> : null}
            </View>
            <View style={styles.stepTextCard}>
                <Text style={styles.stepText}>{content}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        marginBottom: spacing.sm,
    },
    handle: {
        marginRight: spacing.sm,
    },
    label: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
        marginRight: spacing.sm,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepMarkerColumn: {
        alignItems: 'center',
        width: 28,
    },
    stepMarker: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepMarkerText: {
        color: colors.textOnDark,
        fontSize: 12,
        fontWeight: '700',
    },
    stepLine: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    stepTextCard: {
        flex: 1,
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        padding: spacing.sm,
        marginLeft: spacing.sm,
        marginBottom: spacing.sm,
    },
    stepText: {
        fontSize: 13,
        color: colors.textPrimary,
        lineHeight: 19,
    },
});