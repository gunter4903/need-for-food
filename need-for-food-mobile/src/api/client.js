import { File, UploadType } from 'expo-file-system';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

export async function apiFetch(path, { method = 'GET', body, token, isMultipart = false } = {}) {
    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers: {
                // En multipart, ne pas poser Content-Type : fetch/FormData pose lui-même le
                // bon boundary. Le poser manuellement casserait silencieusement l'upload.
                ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: isMultipart ? body : (body ? JSON.stringify(body) : undefined),
        });
    } catch (err) {
        console.error(`apiFetch: fetch() a rejeté pour ${method} ${path}:`, err);
        throw new ApiError(
            `Impossible de contacter le serveur. Vérifiez votre connexion. (${err.message || err})`,
            0
        );
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        throw new ApiError(data?.message || 'Une erreur est survenue.', response.status);
    }

    return data;
}

export async function uploadFile(path, { token, uri, fieldName = 'files', mimeType } = {}) {
    let result;
    try {
        const file = new File(uri);
        result = await file.upload(`${API_URL}${path}`, {
            uploadType: UploadType.MULTIPART,
            fieldName,
            mimeType,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    } catch (err) {
        console.error(`uploadFile: échec pour ${path}:`, err);
        throw new ApiError(
            `Impossible de contacter le serveur. Vérifiez votre connexion. (${err.message || err})`,
            0
        );
    }

    const data = result.body ? JSON.parse(result.body) : null;

    if (result.status < 200 || result.status >= 300) {
        throw new ApiError(data?.message || 'Une erreur est survenue.', result.status);
    }

    return data;
}
