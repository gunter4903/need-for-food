import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import HeartIcon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, radius } from '../../constants/theme';

export default function RecipeCard({ recipe, onPress, style }) {
    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            style={[styles.card, style]}
        >
            <View style={styles.imageWrap}>
                <Image source={recipe.image} style={styles.image} />
                {recipe.favorite ? (
                    <View style={styles.favoriteBadge}>
                        <HeartIcon name="favorite" size={13} color={colors.textOnDark} />
                    </View>
                ) : null}
            </View>
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
        height: 170,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    imageWrap: {
        flex: 1,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    favoriteBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(46,29,18,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
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