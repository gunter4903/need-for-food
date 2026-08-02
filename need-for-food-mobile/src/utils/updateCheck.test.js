jest.mock('expo-constants', () => ({
    expoConfig: { version: '1.0.8' },
}));

import { compareVersions, checkForUpdate, getCurrentVersion } from './updateCheck';

describe('compareVersions', () => {
    it('returns a positive number when the first version is newer', () => {
        expect(compareVersions('1.0.9', '1.0.8')).toBeGreaterThan(0);
        expect(compareVersions('1.1.0', '1.0.8')).toBeGreaterThan(0);
        expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
    });

    it('returns a negative number when the first version is older', () => {
        expect(compareVersions('1.0.7', '1.0.8')).toBeLessThan(0);
    });

    it('returns 0 for equal versions', () => {
        expect(compareVersions('1.0.8', '1.0.8')).toBe(0);
    });
});

describe('getCurrentVersion', () => {
    it('reads the version from expo-constants', () => {
        expect(getCurrentVersion()).toBe('1.0.8');
    });
});

describe('checkForUpdate', () => {
    afterEach(() => {
        global.fetch = undefined;
    });

    it('returns the new version info when a newer version is published', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ version: '1.0.9', date: '2026-08-02' }),
        });

        const result = await checkForUpdate();

        expect(result).toEqual({ version: '1.0.9', date: '2026-08-02' });
    });

    it('returns null when the installed version is already up to date', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ version: '1.0.8', date: '2026-08-01' }),
        });

        expect(await checkForUpdate()).toBeNull();
    });

    it('returns null silently on network failure', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

        expect(await checkForUpdate()).toBeNull();
    });

    it('returns null when the response is not ok', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false });

        expect(await checkForUpdate()).toBeNull();
    });
});
