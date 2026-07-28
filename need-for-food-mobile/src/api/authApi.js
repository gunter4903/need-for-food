import { apiFetch } from './client';

export function login(email, password) {
    return apiFetch('/auth/login', { method: 'POST', body: { email, password } });
}

export function register(email, username, password) {
    return apiFetch('/auth/register', { method: 'POST', body: { email, username, password } });
}

export function verifyAccount(email, code) {
    return apiFetch('/auth/verify', { method: 'POST', body: { email, code } });
}

export function resendVerification(email) {
    return apiFetch('/auth/resend-verification', { method: 'POST', body: { email } });
}

export function getMe(token) {
    return apiFetch('/users/me', { token });
}

export function updateMe(token, { username, email, bio, avatarUrl }) {
    return apiFetch('/users/me', { method: 'PUT', token, body: { username, email, bio, avatarUrl } });
}

export function deleteMe(token) {
    return apiFetch('/users/me', { method: 'DELETE', token });
}

export function changePassword(token, currentPassword, newPassword) {
    return apiFetch('/users/me/password', { method: 'PUT', token, body: { currentPassword, newPassword } });
}
