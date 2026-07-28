import { apiFetch } from './client';

export function searchUsers(token, query) {
    return apiFetch(`/users/search?q=${encodeURIComponent(query)}`, { token });
}

export function sendRequest(token, userId) {
    return apiFetch('/friends/requests', { method: 'POST', token, body: { userId } });
}

export function getReceivedRequests(token) {
    return apiFetch('/friends/requests/received', { token });
}

export function getSentRequests(token) {
    return apiFetch('/friends/requests/sent', { token });
}

export function acceptRequest(token, requestId) {
    return apiFetch(`/friends/requests/${requestId}/accept`, { method: 'PUT', token });
}

export function cancelOrRejectRequest(token, requestId) {
    return apiFetch(`/friends/requests/${requestId}`, { method: 'DELETE', token });
}

export function getFriends(token) {
    return apiFetch('/friends', { token });
}

export function removeFriend(token, friendUserId) {
    return apiFetch(`/friends/${friendUserId}`, { method: 'DELETE', token });
}
