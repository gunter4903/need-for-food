import { apiFetch, ApiError } from './client';

function mockFetchOnce({ ok = true, status = 200, body = null }) {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status,
        text: async () => (body === null ? '' : JSON.stringify(body)),
    });
}

describe('apiFetch', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns the parsed JSON body on success', async () => {
        mockFetchOnce({ body: { id: 1, name: 'Pâtes' } });

        const result = await apiFetch('/recipes/1');

        expect(result).toEqual({ id: 1, name: 'Pâtes' });
    });

    it('returns null when the response body is empty (e.g. 204 No Content)', async () => {
        mockFetchOnce({ ok: true, status: 204, body: null });

        const result = await apiFetch('/shopping-lists/1', { method: 'DELETE', token: 'abc' });

        expect(result).toBeNull();
    });

    it('attaches the Authorization header when a token is provided', async () => {
        mockFetchOnce({ body: { ok: true } });

        await apiFetch('/users/me', { token: 'my-jwt' });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({ Authorization: 'Bearer my-jwt' }),
            })
        );
    });

    it('does not attach an Authorization header when no token is provided', async () => {
        mockFetchOnce({ body: { ok: true } });

        await apiFetch('/auth/login', { method: 'POST', body: { email: 'a@b.dev' } });

        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers.Authorization).toBeUndefined();
        expect(options.body).toBe(JSON.stringify({ email: 'a@b.dev' }));
    });

    it('throws an ApiError with the backend message when the response is not ok', async () => {
        mockFetchOnce({ ok: false, status: 409, body: { message: 'Un compte existe déjà avec cet email' } });

        await expect(apiFetch('/auth/register', { method: 'POST', body: {} })).rejects.toMatchObject({
            message: 'Un compte existe déjà avec cet email',
            status: 409,
        });
    });

    it('falls back to a generic message when the error response has no message field', async () => {
        mockFetchOnce({ ok: false, status: 500, body: null });

        await expect(apiFetch('/recipes')).rejects.toMatchObject({
            message: 'Une erreur est survenue.',
            status: 500,
        });
    });

    it('throws an ApiError with status 0 when the network request itself fails', async () => {
        global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

        const error = await apiFetch('/recipes').catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error.status).toBe(0);
        expect(error.message).toMatch(/connexion/i);
    });
});
