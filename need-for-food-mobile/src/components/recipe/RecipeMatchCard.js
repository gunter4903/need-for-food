import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import HeartIcon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, radius } from '../../constants/theme';
import images from '../../../assets/images/temp/images';

export default function RecipeMatchCard({ recipe, onPress, onToggleFavorite }) {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
            <View style={styles.imageWrap}>
                <Image source={recipe.image} style={styles.image} />
                <TouchableOpacity style={styles.favoriteButton} onPress={onToggleFavorite}>
                    <HeartIcon
                        name={recipe.favorite ? 'favorite' : 'favorite-border'}
                        size={16}
                        color={recipe.favorite ? colors.danger : colors.textOnDark}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.body}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={2}>
                        {recipe.title}
                    </Text>
                    <View style={styles.matchBadge}>
                        <Icon name="check-circle" size={12} color={colors.primary} />
                        <Text style={styles.matchText}>{recipe.matchLabel}</Text>
                    </View>
                </View>
                <View style={styles.metaRow}>
                    {recipe.creatorUsername ? (
                        <>
                            <Image
                                source={recipe.creatorAvatarUrl ? { uri: recipe.creatorAvatarUrl } : images.avatar}
                                style={styles.creatorAvatar}
                            />
                            <Text style={styles.creatorText} numberOfLines={1}>
                                {recipe.creatorUsername}
                            </Text>
                        </>
                    ) : null}
                    <Icon
                        name="clock"
                        size={13}
                        color={colors.textSecondary}
                        style={recipe.creatorUsername ? { marginLeft: spacing.sm } : null}
                    />
                    <Text style={styles.metaText}>{recipe.time}</Text>
                    <Icon name="bar-chart-2" size={13} color={colors.textSecondary} style={{ marginLeft: spacing.sm }} />
                    <Text style={styles.metaText}>{recipe.difficulty}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    imageWrap: {
        position: 'relative',
    },
    image: {
        width: '100%',
        height: 160,
    },
    favoriteButton: {
        position: 'absolute',
        top: spacing.sm,
        right: spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(46,29,18,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        padding: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginRight: spacing.sm,
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    matchText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        marginLeft: 4,
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
    creatorAvatar: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 4,
    },
    creatorText: {
        fontSize: 12,
        color: colors.textSecondary,
        flexShrink: 1,
    },
});