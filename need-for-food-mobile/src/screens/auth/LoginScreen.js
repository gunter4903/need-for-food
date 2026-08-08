import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    ScrollView,
    View,
    Image,
    Text,
    TextInput,
    TouchableOpacity,
    Platform,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/appAlert';

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Veuillez renseigner votre e-mail et votre mot de passe.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.message || 'Impossible de se connecter.');
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
                    {/* Logo */}
                    <View style={styles.logoBlock}>
                        <Image
                            source={require('../../../assets/images/temp/avatar.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={styles.appName}>Need for Food</Text>
                        <Text style={styles.tagline}>Bon retour parmi nous !</Text>
                    </View>

                    {/* Carte formulaire */}
                    <View style={styles.formCard}>
                        <Text style={styles.label}>E-mail</Text>
                        <View style={styles.inputWrap}>
                            <Icon name="mail" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="votre@email.com"
                                placeholderTextColor={colors.textSecondary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.passwordHeader}>
                            <Text style={styles.label}>Mot de passe</Text>
                            <TouchableOpacity onPress={() => navigation?.navigate('MotDePasseOublie')}>
                                <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputWrap}>
                            <Icon name="lock" size={18} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                                <Icon
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={18}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {!!error && <Text style={styles.errorText}>{error}</Text>}

                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.buttonDisabled]}
                            activeOpacity={0.85}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.textOnDark} />
                            ) : (
                                <Text style={typography.button}>Se connecter</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OU</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            activeOpacity={0.85}
                            onPress={() => showAlert('Google', "Cette fonctionnalité n'est pas encore disponible.")}
                        >
                            <Image
                                source={require('../../../assets/images/google-icon.png')}
                                style={styles.googleIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.googleText}>Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Lien inscription */}
                    <View style={styles.signupRow}>
                        <Text style={styles.signupText}>Pas encore de compte ? </Text>
                        <TouchableOpacity onPress={() => navigation?.navigate('Inscription')}>
                            <Text style={styles.signupLink}>S'inscrire</Text>
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
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        justifyContent: 'center',
    },
    logoBlock: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logo: {
        width: 72,
        height: 72,
        marginBottom: spacing.sm,
    },
    appName: {
        ...typography.h1,
        color: colors.primaryDark,
    },
    tagline: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: 4,
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
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
    },
    forgotLink: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 50,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        marginTop: spacing.md,
    },
    loginButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.pill,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
    },
    buttonDisabled: {
        opacity: 0.7,
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
        fontSize: 12,
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
    signupRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    signupText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    signupLink: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});