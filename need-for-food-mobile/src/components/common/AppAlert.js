import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { registerAlertListener } from '../../utils/appAlert';

const DEFAULT_BUTTONS = [{ text: 'OK' }];

export default function AppAlert() {
    const [alert, setAlert] = useState(null);

    useEffect(() => {
        registerAlertListener(setAlert);
        return () => registerAlertListener(null);
    }, []);

    if (!alert) {
        return null;
    }

    const buttons = alert.buttons?.length ? alert.buttons : DEFAULT_BUTTONS;
    const close = () => setAlert(null);

    return (
        <Modal visible transparent animationType="fade" onRequestClose={close}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={typography.h3}>{alert.title}</Text>
                    {!!alert.message && (
                        <ScrollView style={styles.messageScroll} showsVerticalScrollIndicator={false}>
                            <Text style={styles.message}>{alert.message}</Text>
                        </ScrollView>
                    )}

                    <View style={buttons.length > 1 ? styles.buttonRow : styles.buttonColumn}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={`${button.text}-${index}`}
                                activeOpacity={0.85}
                                style={[
                                    styles.button,
                                    buttons.length > 1 ? styles.buttonFlex : styles.buttonFull,
                                    buttonStyle(button.style),
                                    buttons.length > 1 && index > 0 && styles.buttonSpacing,
                                ]}
                                onPress={() => {
                                    close();
                                    button.onPress?.();
                                }}
                            >
                                <Text style={[styles.buttonText, buttonTextStyle(button.style)]}>
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function buttonStyle(style) {
    if (style === 'cancel') return styles.buttonCancel;
    if (style === 'destructive') return styles.buttonDestructive;
    return styles.buttonPrimary;
}

function buttonTextStyle(style) {
    if (style === 'cancel') return styles.buttonTextCancel;
    return styles.buttonTextOnColor;
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        maxHeight: '85%',
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    messageScroll: {
        maxHeight: 280,
    },
    message: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
        lineHeight: 20,
    },
    buttonRow: {
        flexDirection: 'row',
    },
    buttonColumn: {
        marginTop: spacing.md,
    },
    button: {
        height: 46,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonFlex: {
        flex: 1,
    },
    buttonFull: {
        alignSelf: 'stretch',
    },
    buttonSpacing: {
        marginLeft: spacing.sm,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonDestructive: {
        backgroundColor: colors.danger,
    },
    buttonCancel: {
        backgroundColor: colors.cardMuted,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '700',
    },
    buttonTextOnColor: {
        color: colors.textOnDark,
    },
    buttonTextCancel: {
        color: colors.textSecondary,
    },
});
