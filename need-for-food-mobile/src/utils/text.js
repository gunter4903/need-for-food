const ACCENTS = {
    à: 'a', â: 'a', ä: 'a', á: 'a', ã: 'a', å: 'a',
    é: 'e', è: 'e', ê: 'e', ë: 'e',
    î: 'i', ï: 'i', í: 'i', ì: 'i',
    ô: 'o', ö: 'o', ó: 'o', ò: 'o', õ: 'o',
    ù: 'u', û: 'u', ü: 'u', ú: 'u',
    ç: 'c',
    ñ: 'n',
    ÿ: 'y',
    œ: 'oe',
    æ: 'ae',
};

// Minuscule + accents retirés via une table de correspondance plutôt que
// String.prototype.normalize('NFD') : support incomplet/incertain sur Hermes
// (moteur JS de React Native) selon la version, alors qu'un simple replace
// fonctionne partout de façon identique.
export function normalizeText(value) {
    return (value || '')
        .toLowerCase()
        .split('')
        .map((char) => ACCENTS[char] || char)
        .join('');
}

export function textIncludes(haystack, needle) {
    return normalizeText(haystack).includes(normalizeText(needle));
}
