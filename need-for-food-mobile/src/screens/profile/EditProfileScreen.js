import React, { useState } from 'react';
import {
    ScrollView,
    Image,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import BottomNav from '../../components/common/BottomNav';

export default function EditProfileScreen({ navigation }) {
    const [firstName, setFirstName] = useState('Julia');
    const [lastName, setLastName] = useState('Martin');
    const [email, setEmail] = useState('julia.chef@foodapp.com');
    const [bio, setBio] = useState('Passionné de cuisine française & créative');

    const handleSave = () => {
        // TODO: modifications (firstName, lastName, email, bio)
        navigation?.goBack();
    };

    const handleDeleteAccount = () => {
        // TODO: afficher une confirmation puis supprimer le compte
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} showAvatar={false} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Modifier le Profil</Text>

                <View style={styles.avatarBlock}>
                    <View style={styles.avatarWrap}>
                        <Image
                            source={images.avatarLarge}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editBadge} activeOpacity={0.8}>
                            <Icon name="edit-2" size={13} color={colors.textOnDark} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.avatarHint}>Changer la photo de profil</Text>
                </View>

                <FormInput label="Prénom" value={firstName} onChangeText={setFirstName} />
                <FormInput label="Nom" value={lastName} onChangeText={setLastName} />
                <FormInput
                    label="E-mail"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <FormInput
                    label="Bio"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    numberOfLines={3}
                />

                <TouchableOpacity style={styles.passwordRow} activeOpacity={0.7}>
                    <Icon name="lock" size={15} color={colors.primary} />
                    <Text style={styles.passwordLabel}>Changer le mot de passe</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
                    <Text style={styles.saveLabel}>Enregistrer les modifications</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7} onPress={handleDeleteAccount}>
                    <Icon name="x-square" size={15} color={colors.danger} />
                    <Text style={styles.deleteLabel}>Supprimer le compte</Text>
                </TouchableOpacity>
                <Text style={styles.deleteHint}>
                    Cette action est irréversible et supprimera toutes vos données.
                </Text>
            </ScrollView>

            <BottomNav />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    avatarBlock: {
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    avatarWrap: {
        marginBottom: spacing.xs,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    avatarHint: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    passwordLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginLeft: 6,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.danger,
        marginLeft: 6,
    },
    deleteHint: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
});