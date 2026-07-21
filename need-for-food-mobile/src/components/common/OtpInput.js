import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../constants/theme';

export default function OtpInput({ length = 6, value, onChange }) {
    const inputRefs = useRef([]);
    const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

    const handleChangeDigit = (text, index) => {
        const clean = text.replace(/[^0-9]/g, '');
        const nextDigits = [...digits];
        nextDigits[index] = clean.slice(-1);
        onChange(nextDigits.join(''));

        if (clean && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.row}>
            {digits.map((digit, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[styles.box, digit && styles.boxFilled]}
                    value={digit}
                    onChangeText={(text) => handleChangeDigit(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    box: {
        width: 44,
        height: 52,
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.background,
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    boxFilled: {
        borderColor: colors.primary,
    },
});