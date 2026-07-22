import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export default function StepTimelineItem({ number, content, isLast }) {
    return (
        <View style={styles.row}>
            <View style={styles.markerColumn}>
                <View style={styles.marker}>
                    <Text style={styles.markerText}>{number}</Text>
                </View>
                {!isLast ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.textCard}>
                <Text style={styles.text}>{content}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    markerColumn: {
        alignItems: 'center',
        width: 32,
    },
    marker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerText: {
        color: colors.textOnDark,
        fontSize: 13,
        fontWeight: '700',
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    textCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        padding: spacing.sm,
        marginLeft: spacing.sm,
        marginBottom: spacing.md,
    },
    text: {
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 20,
    },
});