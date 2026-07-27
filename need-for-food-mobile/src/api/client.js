const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError("Impossible de contacter le serveur. Vérifiez votre connexion.", 0);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        throw new ApiError(data?.message || 'Une erreur est survenue.', response.status);
    }

    return data;
}
