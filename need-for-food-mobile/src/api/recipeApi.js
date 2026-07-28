import { apiFetch } from './client';

export function getAll(token) {
    return apiFetch('/recipes', { token });
}

export function getMine(token) {
    return apiFetch('/recipes/mine', { token });
}

export function getByUser(token, userId) {
    return apiFetch(`/recipes/user/${userId}`, { token });
}

export function getById(token, id) {
    return apiFetch(`/recipes/${id}`, { token });
}

export function search(token, ingredientNames) {
    const query = ingredientNames.map(encodeURIComponent).join(',');
    return apiFetch(`/recipes/search?ingredients=${query}`, { token });
}

export function getSuggestions(token) {
    return apiFetch('/recipes/suggestions', { token });
}

export function create(token, recipe) {
    return apiFetch('/recipes', { method: 'POST', token, body: recipe });
}

export function update(token, id, recipe) {
    return apiFetch(`/recipes/${id}`, { method: 'PUT', token, body: recipe });
}

export function remove(token, id) {
    return apiFetch(`/recipes/${id}`, { method: 'DELETE', token });
}
