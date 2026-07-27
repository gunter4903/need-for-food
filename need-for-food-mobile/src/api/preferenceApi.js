import { apiFetch } from './client';

export function getMine(token) {
    return apiFetch('/preferences/me', { token });
}

export function updateMine(token, preferences) {
    return apiFetch('/preferences/me', { method: 'PUT', token, body: preferences });
}
