import { apiFetch } from './client';

export function getPublicProfile(token, userId) {
    return apiFetch(`/users/${userId}`, { token });
}

export function exportData(token) {
    return apiFetch('/users/me/export', { token });
}

export function importData(token, payload) {
    return apiFetch('/users/me/import', { method: 'POST', token, body: payload });
}
