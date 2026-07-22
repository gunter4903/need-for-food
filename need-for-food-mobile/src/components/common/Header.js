import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing } from '../../constants/theme';
import images from '../../../assets/images/temp/images';

export default function Header({
                                   onBack,
                                   showAvatar = true,
                                   avatarSource = images.avatar,
                                   onAvatarPress,
                                   centered = false,
                               }) {
    return (
        <View style={styles.container}>
            <View style={styles.side}>
                {onBack ? (
                    <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon name="arrow-left" size={22} color={colors.textPrimary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            <View style={[styles.brand, centered && styles.brandCentered]}>
                <Image source={images.appIcon} style={styles.logo} />
                <Text style={styles.title}>Need for Food</Text>
            </View>

            <View style={[styles.side, styles.sideRight]}>
                {showAvatar ? (
                    <TouchableOpacity onPress={onAvatarPress}>
                        <Image source={avatarSource} style={styles.avatar} />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
    },
    side: {
        width: 40,
        alignItems: 'flex-start',
    },
    sideRight: {
        alignItems: 'flex-end',
    },
    brand: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    brandCentered: {
        position: 'absolute',
        left: 0,
        right: 0,
        justifyContent: 'center',
    },
    logoEmoji: {
        fontSize: 18,
        marginRight: 6,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primaryDark,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: colors.primarySoft,
    },
    logo: {
        width: 36,
        height: 36,
    },
});