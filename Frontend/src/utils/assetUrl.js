import { BASE_URL } from '../api/client';

export const resolveAssetUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const normalized = path.startsWith('/') ? path.substring(1) : path;
    return `${BASE_URL}${normalized}`;
};
