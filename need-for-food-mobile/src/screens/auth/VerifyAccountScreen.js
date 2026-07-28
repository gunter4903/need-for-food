import React, { useState } from 'react';
import {
    ScrollView,
    View,
    Image,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors, spacing, radius, typography } from '../../constants/theme';
import OtpInput from '../../components/auth/OtpInput';
import { useAuth } from '../../context/AuthContext';

export default function VerifyAccountScreen({ route }) {
    const { user, verifyAccount, resendVerificationCode, logout } = useAuth();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const email = route?.params?.email || user?.email;

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Veuillez saisir les 6 chiffres du code.');
            return;
        }
        setError('');
        setInfo('');
        setLoading(true);
        try {
            await verifyAccount(email, code);
        } catch (err) {
            setError(err.message || 'Code de vérification invalide ou expiré.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError('');
        setInfo('');
        setResending(true);
        try {
            await resendVerificationCode(email);
            setInfo('Un nouveau code vous a été envoyé par e-mail.');
        } catch (err) {
            setError(err.message || "Impossible de renvoyer le code.");
        } finally {
            setResending(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoBlock}>
                    <Image
                        source={require('../../../assets/images/temp/avatar.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>Need for Food</Text>
                    <Text style={styles.tagline}>Pour être sûr que ce soit vous !</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Vérification de compte</Text>
                    <Text style={styles.cardSubtitle}>
                        Veuillez saisir le code de validation à 6 chiffres envoyé à votre
                        adresse e-mail{email ? ` (${email})` : ''}.
                    </Text>

                    <OtpInput value={code} onChange={setCode} />

                    {!!error && <Text style={styles.errorText}>{error}</Text>}
                    {!!info && <Text style={styles.infoText}>{info}</Text>}

                    <TouchableOpacity
                        style={[styles.verifyButton, loading && styles.buttonDisabled]}
                        activeOpacity={0.85}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.textOnDark} />
                        ) : (
                            <>
                                <Icon name="check-circle" size={18} color={colors.textOnDark} style={{ marginRight: 8 }} />
                                <Text style={typography.button}>Vérifier</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendRow}>
                        <Text style={styles.resendText}>Vous n'avez pas reçu le code ?</Text>
                        <TouchableOpacity onPress={handleResend} disabled={resending}>
                            <Text style={styles.resendLink}>
                                {resending ? 'Envoi en cours...' : 'Renvoyer le code'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {user ? (
                    <TouchableOpacity style={styles.helpRow} onPress={logout}>
                        <Icon name="log-out" size={16} color={colors.textSecondary} />
                        <Text style={styles.helpText}>Se déconnecter</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.helpRow}>
                        <Icon name="help-circle" size={16} color={colors.textSecondary} />
                        <Text style={styles.helpText}>Besoin d'aide ?</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.footer}>© 2026 Need for Food. Tous droits réservés.</Text>
            </ScrollView>
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
        justifyContent: 'space-between',
    },
    logoBlock: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logo: {
        width: 64,
        height: 64,
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
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    cardTitle: {
        ...typography.h2,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    cardSubtitle: {
        ...typography.caption,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    errorText: {
        color: colors.danger,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    infoText: {
        color: colors.primary,
        fontSize: 13,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.pill,
        height: 52,
        width: '100%',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    resendRow: {
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    resendText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginTop: 4,
    },
    helpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    helpText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginLeft: 6,
    },
    footer: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
});