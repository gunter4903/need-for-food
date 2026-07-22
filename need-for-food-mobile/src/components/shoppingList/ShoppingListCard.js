import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export default function ShoppingListCard({ list, onPress }) {
    const isComplete = list.completed === 100;
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
            <View style={styles.headerRow}>
                <View style={styles.textBlock}>
                    <Text style={styles.title}>{list.title}</Text>
                    <Text style={styles.subtitle}>{list.subtitle}</Text>
                </View>
                <View style={styles.iconWrap}>
                    <Text style={styles.iconEmoji}>{list.emoji}</Text>
                </View>
            </View>

            <View style={styles.progressRow}>
                <Text style={styles.progressCount}>{list.itemsLabel}</Text>
                <Text style={[styles.progressPercent, isComplete && styles.progressPercentDone]}>
                    {isComplete ? 'Terminé !' : `${list.completed}% complété`}
                </Text>
            </View>

            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${list.completed}%` },
                        isComplete && styles.progressFillDone,
                    ]}
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    textBlock: {
        flex: 1,
        marginRight: spacing.sm,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: radius.sm,
        backgroundColor: colors.cardMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconEmoji: {
        fontSize: 16,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressCount: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    progressPercentDone: {
        color: colors.success,
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.cardMuted,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: colors.primaryDark,
    },
    progressFillDone: {
        backgroundColor: colors.success,
    },
});