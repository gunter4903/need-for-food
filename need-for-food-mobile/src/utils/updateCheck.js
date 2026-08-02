import Constants from 'expo-constants';

const VERSION_URL = 'https://needforfood.fr/downloads/version.json';

export function getCurrentVersion() {
    return Constants.expoConfig?.version || null;
}

export function compareVersions(a, b) {
    const partsA = String(a).split('.').map(Number);
    const partsB = String(b).split('.').map(Number);
    const length = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < length; i++) {
        const diff = (partsA[i] || 0) - (partsB[i] || 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

export async function checkForUpdate() {
    const current = getCurrentVersion();
    if (!current) return null;

    try {
        const response = await fetch(VERSION_URL, { cache: 'no-store' });
        if (!response.ok) return null;
        const data = await response.json();
        if (data?.version && compareVersions(data.version, current) > 0) {
            return { version: data.version, date: data.date };
        }
    } catch {
        // Pas de connexion / site injoignable : on ignore silencieusement.
    }
    return null;
}
