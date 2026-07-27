import { apiFetch } from './client';

export function getAll(token) {
    return apiFetch('/ingredients', { token });
}
