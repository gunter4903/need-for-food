import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';

export default function SelectField({ label, value, options, onSelect, containerStyle }) {
    const [open, setOpen] = useState(false);

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={() => setOpen(true)}>
                <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                    {value}
                </Text>
                <Icon name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
                    <View style={styles.menu}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.option}
                                activeOpacity={0.7}
                                onPress={() => {
                                    onSelect(option);
                                    setOpen(false);
                                }}
                            >
                                <Text style={[styles.optionText, option === value && styles.optionTextActive]}>
                                    {option}
                                </Text>
                                {option === value ? <Icon name="check" size={16} color={colors.primary} /> : null}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
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
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 50,
    },
    value: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
        marginRight: spacing.sm,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    menu: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        paddingVertical: spacing.xs,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
    },
    optionText: {
        fontSize: 15,
        color: colors.textPrimary,
    },
    optionTextActive: {
        fontWeight: '700',
        color: colors.primary,
    },
});
