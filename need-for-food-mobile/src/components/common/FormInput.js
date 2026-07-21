import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function FormInput({
                                      label,
                                      icon,
                                      rightIcon,
                                      onRightIconPress,
                                      containerStyle,
                                      ...textInputProps
                                  }) {
    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <View
                style={[
                    styles.inputRow,
                    textInputProps.multiline && styles.inputRowMultiline,
                ]}
            >
                {icon ? (
                    <Icon name={icon} size={17} color={colors.textSecondary} style={styles.icon} />
                ) : null}
                <TextInput
                    style={[styles.input, textInputProps.multiline && styles.inputMultiline]}
                    placeholderTextColor={colors.textSecondary}
                    {...textInputProps}
                />
                {rightIcon ? (
                    <TouchableOpacity onPress={onRightIconPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon name={rightIcon} size={17} color={colors.textSecondary} />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 50,
    },
    inputRowMultiline: {
        height: 90,
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
    },
    icon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
    },
    inputMultiline: {
        height: '100%',
        textAlignVertical: 'top',
    },
});