import React from 'react';
import { ScrollView, TouchableOpacity, Image, Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function MultiPhotoPicker({ images, onAdd, onRemove, maxCount = 5 }) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
            {images.map((image) => (
                <View key={image.key} style={styles.tile}>
                    <Image source={{ uri: image.uri }} style={styles.image} />
                    <TouchableOpacity
                        style={styles.removeBadge}
                        activeOpacity={0.8}
                        testID={`multi-photo-picker-remove-${image.key}`}
                        onPress={() => onRemove(image.key)}
                    >
                        <Icon name="x" size={14} color={colors.textOnDark} />
                    </TouchableOpacity>
                </View>
            ))}

            {images.length < maxCount ? (
                <TouchableOpacity style={styles.addTile} activeOpacity={0.8} onPress={onAdd}>
                    <Icon name="camera" size={22} color={colors.textSecondary} />
                    <Text style={styles.addLabel}>Ajouter</Text>
                </TouchableOpacity>
            ) : null}
        </ScrollView>
    );
}

const TILE_SIZE = 90;

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    tile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: radius.md,
        overflow: 'hidden',
        marginRight: spacing.sm,
        backgroundColor: colors.cardMuted,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    removeBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.danger,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addTile: {
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
        backgroundColor: colors.cardMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 4,
    },
});
