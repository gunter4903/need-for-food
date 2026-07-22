import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing } from '../../constants/theme';

const TABS = [
    { key: 'Accueil', icon: 'home', route: 'Accueil' },
    { key: 'Recettes', icon: 'search', route: 'ChercherRecettes' },
    { key: 'Courses', icon: 'shopping-cart', route: 'MesListesCourses' },
    { key: 'Profil', icon: 'user', route: 'Profil' },
];

const ROUTE_TO_TAB = {
    Accueil: 'Accueil',
    ChercherRecettes: 'Recettes',
    DetailsRecette: 'Recettes',
    AjouterRecette: 'Recettes',
    ModifierRecette: 'Recettes',
    MesListesCourses: 'Courses',
    ListeCourses: 'Courses',
    CreerListeCourses: 'Courses',
    Profil: 'Profil',
    ModifierProfil: 'Profil',
};

export default function BottomNav() {
    const navigation = useNavigation();
    const currentRouteName = useNavigationState((state) => {
        if (!state) return undefined;
        const route = state.routes[state.index];
        return route?.name;
    });
    const active = ROUTE_TO_TAB[currentRouteName] || 'Accueil';

    return (
        <View style={styles.container}>
            {TABS.map((tab) => {
                const isActive = tab.key === active;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={styles.tab}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate(tab.route)}
                    >
                        <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                            <Icon
                                name={tab.icon}
                                size={20}
                                color={isActive ? colors.textOnDark : colors.textSecondary}
                            />
                        </View>
                        <Text style={[styles.label, isActive && styles.labelActive]}>
                            {tab.key}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 64,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    iconWrapActive: {
        backgroundColor: colors.primary,
    },
    label: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    labelActive: {
        color: colors.primary,
        fontWeight: '700',
    },
});