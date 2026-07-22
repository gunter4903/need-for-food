import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function RecipeCard({ recipe, onPress, style }) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.card, style]}
        >
            <Image source={recipe.image} style={styles.image} />
            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>
                    {recipe.title}
                </Text>
                <View style={styles.metaRow}>
                    <Icon name="clock" size={12} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{recipe.time}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 100,
    },
    body: {
        padding: spacing.sm,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 4,
    },
});