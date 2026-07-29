import React from 'react';
import { TouchableOpacity, ImageBackground, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import HeartIcon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, radius } from '../../constants/theme';

export default function FeaturedRecipeCard({ recipe, onPress }) {
    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
            <ImageBackground
                source={recipe.image}
                style={styles.image}
                imageStyle={{ borderRadius: radius.lg }}
            >
                <View style={styles.gradientOverlay} />

                {recipe.badge ? (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{recipe.badge}</Text>
                    </View>
                ) : null}

                {recipe.favorite ? (
                    <View style={styles.favoriteBadge}>
                        <HeartIcon name="favorite" size={16} color={colors.danger} />
                    </View>
                ) : null}

                <View style={styles.textBlock}>
                    <Text style={styles.title}>{recipe.title}</Text>
                    <View style={styles.metaRow}>
                        <Icon name="clock" size={13} color={colors.textOnDark} />
                        <Text style={styles.metaText}>{recipe.time}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{recipe.difficulty}</Text>
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius.lg,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    image: {
        width: '100%',
        height: 230,
        justifyContent: 'flex-end',
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.overlay,
        borderRadius: radius.lg,
    },
    badge: {
        position: 'absolute',
        top: spacing.md,
        left: spacing.md,
        backgroundColor: colors.primarySoft,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    badgeText: {
        color: colors.textOnDark,
        fontSize: 12,
        fontWeight: '700',
    },
    favoriteBadge: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.85)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    textBlock: {
        padding: spacing.md,
    },
    title: {
        color: colors.textOnDark,
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        color: colors.textOnDark,
        fontSize: 13,
        marginLeft: 4,
        fontWeight: '500',
    },
    metaDot: {
        color: colors.textOnDark,
        marginHorizontal: 6,
    },
});