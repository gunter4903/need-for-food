import { apiFetch, uploadFile } from './client';

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

export async function addImages(token, id, files) {
    let recipe;
    for (const file of files) {
        recipe = await uploadFile(`/recipes/${id}/images`, {
            token,
            uri: file.uri,
            fieldName: 'files',
            mimeType: file.mimeType || 'image/jpeg',
        });
    }
    return recipe;
}

export function removeImage(token, id, imageId) {
    return apiFetch(`/recipes/${id}/images/${imageId}`, { method: 'DELETE', token });
}

export function addFavorite(token, id) {
    return apiFetch(`/recipes/${id}/favorite`, { method: 'POST', token });
}

export function removeFavorite(token, id) {
    return apiFetch(`/recipes/${id}/favorite`, { method: 'DELETE', token });
}
