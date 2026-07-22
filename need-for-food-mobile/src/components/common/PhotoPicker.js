import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function PhotoPicker({ imageUri, onPress, label = 'Sélectionner une photo' }) {
    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.8} onPress={onPress}>
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
                <>
                    <Icon name="camera" size={26} color={colors.textSecondary} />
                    <Text style={styles.label}>{label}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 180,
        borderRadius: radius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
        backgroundColor: colors.cardMuted,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});