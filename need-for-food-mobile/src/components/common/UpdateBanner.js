import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, AppState } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius } from '../../constants/theme';
import { checkForUpdate } from '../../utils/updateCheck';

export default function UpdateBanner() {
    const [update, setUpdate] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const runCheck = () => {
            checkForUpdate().then((result) => {
                if (!cancelled) setUpdate(result);
            });
        };

        runCheck();
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') runCheck();
        });

        return () => {
            cancelled = true;
            subscription.remove();
        };
    }, []);

    if (!update) return null;

    return (
        <TouchableOpacity
            style={styles.banner}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('https://needforfood.fr')}
        >
            <Icon name="download" size={18} color={colors.textOnDark} />
            <Text style={styles.text}>Nouvelle version {update.version} disponible — Télécharger</Text>
            <Icon name="chevron-right" size={18} color={colors.textOnDark} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    text: {
        flex: 1,
        color: colors.textOnDark,
        fontSize: 13,
        fontWeight: '700',
        marginLeft: spacing.sm,
    },
});
