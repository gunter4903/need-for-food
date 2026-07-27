import { apiFetch } from './client';

export function getMine(token) {
    return apiFetch('/shopping-lists/mine', { token });
}

export function getById(token, id) {
    return apiFetch(`/shopping-lists/${id}`, { token });
}

export function create(token, name) {
    return apiFetch('/shopping-lists', { method: 'POST', token, body: { name } });
}

export function generate(token, name, recipeIds) {
    return apiFetch('/shopping-lists/generate', { method: 'POST', token, body: { name, recipeIds } });
}

export function addItem(token, listId, { ingredientName, unit, quantity }) {
    return apiFetch(`/shopping-lists/${listId}/items`, {
        method: 'POST',
        token,
        body: { ingredientName, unit, quantity },
    });
}

export function setItemChecked(token, listId, ingredientId, checked) {
    return apiFetch(`/shopping-lists/${listId}/items/${ingredientId}`, {
        method: 'PATCH',
        token,
        body: { checked },
    });
}

export function removeItem(token, listId, ingredientId) {
    return apiFetch(`/shopping-lists/${listId}/items/${ingredientId}`, { method: 'DELETE', token });
}

export function remove(token, listId) {
    return apiFetch(`/shopping-lists/${listId}`, { method: 'DELETE', token });
}
