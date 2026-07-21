export const colors = {
    background: '#FCF1E4',       // fond crème général
    card: '#FFFFFF',             // fond des cartes / inputs
    cardMuted: '#F6EBDD',        // fond des lignes "Nouveautés" / chips inactifs
    border: '#EFDFC9',

    primary: '#E67E22',          // orange principal (CTA, icônes actives)
    primaryDark: '#B85C00',      // titre "Need for Food", liens
    primarySoft: '#F3A94B',      // badge "Populaire" actif / "Coup de cœur"

    textPrimary: '#2E1D12',      // titres, noms
    textSecondary: '#7A6A5C',    // sous-titres, placeholders
    textOnDark: '#FFFFFF',

    danger: '#D9534F',           // "Déconnexion"
    success: '#6FA96C',

    overlay: 'rgba(0,0,0,0.35)', // dégradé sombre sur les images des recettes
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
};

export const radius = {
    sm: 8,
    md: 14,
    lg: 20,
    pill: 999,
};

export const typography = {
    h1: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
    h2: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
    h3: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
    body: { fontSize: 15, fontWeight: '400', color: colors.textPrimary },
    caption: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
    button: { fontSize: 16, fontWeight: '700', color: colors.textOnDark },
    eyebrow: { fontSize: 14, fontWeight: '600', color: colors.primaryDark },
};

export default { colors, spacing, radius, typography };