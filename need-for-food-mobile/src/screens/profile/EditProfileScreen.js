import React, { useState } from 'react';
import {
    ScrollView,
    Image,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, typography } from '../../constants/theme';
import images from '../../../assets/images/temp/images';
import Header from '../../components/common/Header';
import FormInput from '../../components/common/FormInput';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';

function splitUsername(username) {
    const [firstName, ...rest] = (username || '').split(' ');
    return { firstName: firstName || '', lastName: rest.join(' ') };
}

export default function EditProfileScreen({ navigation }) {
    const { user, updateProfile, deleteAccount, changePassword } = useAuth();
    const initial = splitUsername(user?.username);

    const [firstName, setFirstName] = useState(initial.firstName);
    const [lastName, setLastName] = useState(initial.lastName);
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const handlePickAvatar = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError("L'accès à vos photos est nécessaire pour changer l'avatar.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            base64: true,
            quality: 0.5,
            allowsEditing: true,
            aspect: [1, 1],
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setAvatarUri(`data:image/jpeg;base64,${asset.base64}`);
        }
    };

    const handleSave = async () => {
        const username = `${firstName} ${lastName}`.trim();

        if (!username || !email) {
            setError('Le nom et l\'e-mail sont obligatoires.');
            return;
        }

        setError('');
        setSaving(true);
        try {
            await updateProfile({ username, email, bio, avatarUrl: avatarUri });
            navigation?.goBack();
        } catch (err) {
            setError(err.message || 'Impossible d\'enregistrer les modifications.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            setPasswordError('Veuillez renseigner votre mot de passe actuel et le nouveau.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordError('Les mots de passe ne correspondent pas.');
            return;
        }

        setPasswordError('');
        setPasswordSuccess('');
        setChangingPassword(true);
        try {
            await changePassword(currentPassword, newPassword);
            setPasswordSuccess('Mot de passe mis à jour.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            setPasswordError(err.message || 'Impossible de changer le mot de passe.');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Supprimer le compte',
            'Cette action est irréversible et supprimera toutes vos données. Confirmer ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteAccount();
                        } catch (err) {
                            setDeleting(false);
                            setError(err.message || 'Impossible de supprimer le compte.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header onBack={() => navigation?.goBack()} showAvatar={false} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={typography.h1}>Modifier le Profil</Text>

                <View style={styles.avatarBlock}>
                    <View style={styles.avatarWrap}>
                        <Image
                            source={avatarUri ? { uri: avatarUri } : images.avatar}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editBadge} activeOpacity={0.8} onPress={handlePickAvatar}>
                            <Icon name="edit-2" size={13} color={colors.textOnDark} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.avatarHint}>Changer la photo de profil</Text>
                    {!!avatarUri && (
                        <TouchableOpacity onPress={() => setAvatarUri('')}>
                            <Text style={styles.removePhotoLink}>Supprimer la photo</Text>
                        </TouchableOpacity>
                    )}
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

                <TouchableOpacity
                    style={styles.passwordRow}
                    activeOpacity={0.7}
                    onPress={() => setShowPasswordSection((v) => !v)}
                >
                    <View style={styles.passwordRowLeft}>
                        <Icon name="lock" size={15} color={colors.primary} />
                        <Text style={styles.passwordLabel}>Changer le mot de passe</Text>
                    </View>
                    <Icon name={showPasswordSection ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                {showPasswordSection && (
                    <View style={styles.passwordCard}>
                        <FormInput
                            label="Mot de passe actuel"
                            placeholder="••••••••"
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <FormInput
                            label="Nouveau mot de passe"
                            placeholder="••••••••"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                        <FormInput
                            label="Confirmer le nouveau mot de passe"
                            placeholder="••••••••"
                            secureTextEntry
                            value={confirmNewPassword}
                            onChangeText={setConfirmNewPassword}
                        />
                        {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                        {!!passwordSuccess && <Text style={styles.successText}>{passwordSuccess}</Text>}
                        <TouchableOpacity
                            style={[styles.passwordSubmitButton, changingPassword && styles.buttonDisabled]}
                            activeOpacity={0.85}
                            onPress={handleChangePassword}
                            disabled={changingPassword}
                        >
                            {changingPassword ? (
                                <ActivityIndicator color={colors.textOnDark} />
                            ) : (
                                <Text style={typography.button}>Mettre à jour le mot de passe</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.buttonDisabled]}
                    activeOpacity={0.85}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={colors.textPrimary} />
                    ) : (
                        <Text style={styles.saveLabel}>Enregistrer les modifications</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                    style={styles.deleteRow}
                    activeOpacity={0.7}
                    onPress={handleDeleteAccount}
                    disabled={deleting}
                >
                    {deleting ? (
                        <ActivityIndicator color={colors.danger} size="small" />
                    ) : (
                        <>
                            <Icon name="x-square" size={15} color={colors.danger} />
                            <Text style={styles.deleteLabel}>Supprimer le compte</Text>
                        </>
                    )}
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
    removePhotoLink: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.danger,
        marginTop: 4,
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    passwordRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginLeft: 6,
    },
    passwordCard: {
        backgroundColor: colors.cardMuted,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    passwordSubmitButton: {
        backgroundColor: colors.primaryDark,
        borderRadius: radius.pill,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xs,
    },
    successText: {
        color: colors.success,
        fontSize: 13,
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginBottom: spacing.md,
    },
    saveButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
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
