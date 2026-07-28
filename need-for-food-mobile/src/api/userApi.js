import { apiFetch } from './client';

export function getPublicProfile(token, userId) {
    return apiFetch(`/users/${userId}`, { token });
}
