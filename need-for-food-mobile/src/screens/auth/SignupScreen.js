import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    View,
    Image,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../constants/theme';
import FormInput from '../../components/common/FormInput';
import { useAuth } from '../../context/AuthContext';

export default function SignupScreen({ navigation }) {
    const { register } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        const username = `${firstName} ${lastName}`.trim();

        if (!username || !email || !password) {
            setError('Veuillez remplir tous les champs.');
            return;
        }
        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await register(email, username, password);
        } catch (err) {
            setError(err.message || 'Impossible de créer le compte.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.logoBlock}>
                        <Image
                            source={require('../../../assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>Need for Food</Text>
                        <Text style={styles.tagline}>Rejoignez notre communauté culinaire</Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.row}>
                            <FormInput
                                label="Prénom"
                                placeholder="Jean"
                                value={firstName}
                                onChangeText={setFirstName}
                                containerStyle={styles.halfField}
                            />
                            <FormInput
                                label="Nom"
                                placeholder="Dupont"
                                value={lastName}
                                onChangeText={setLastName}
                                containerStyle={styles.halfField}
                            />
                        </View>

                        <FormInput
                            label="E-mail"
                            icon="mail"
                            placeholder="nom@exemple.com"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <FormInput
                            label="Mot de passe"
                            icon="lock"
                            placeholder="••••••••"
                            secureTextEntry={!showPassword}
                            rightIcon={showPassword ? 'eye-off' : 'eye'}
                            onRightIconPress={() => setShowPassword((v) => !v)}
                            value={password}
                            onChangeText={setPassword}
                        />

                        <FormInput
                            label="Confirmer le mot de passe"
                            icon="shield"
                            placeholder="••••••••"
                            secureTextEntry={!showConfirmPassword}
                            rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
                            onRightIconPress={() => setShowConfirmPassword((v) => !v)}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.buttonDisabled]}
                            activeOpacity={0.85}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.textOnDark} />
                            ) : (
                                <>
                                    <Text style={typography.button}>Créer un compte</Text>
                                    <Text style={styles.arrow}>→</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OU S'INSCRIRE AVEC</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.googleButton} activeOpacity={0.85}>
                            <Image
                                source={require('../../../assets/images/google-icon.png')}
                                style={styles.googleIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.googleText}>Google</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
                        <TouchableOpacity onPress={() => navigation?.navigate('Connexion')}>
                            <Text style={styles.loginLink}>Connectez-vous</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.lg,
    },
    logoBlock: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    logo: {
        width: 60,
        height: 60,
        marginBottom: spacing.xs,
    },
    appName: {
        ...typography.h1,
        color: colors.primaryDark,
    },
    tagline: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    formCard: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    halfField: {
        flex: 1,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginTop: spacing.sm,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 52,
        marginTop: spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    arrow: {
        color: colors.textOnDark,
        fontSize: 18,
        fontWeight: '700',
        marginLeft: spacing.xs,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        marginHorizontal: spacing.sm,
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    googleIcon: {
        width: 20,
        height: 20,
        marginRight: spacing.sm,
    },
    googleText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    loginText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});