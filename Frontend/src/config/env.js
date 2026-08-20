const readEnv = (key, fallback = '') =>
    import.meta.env[`VITE_${key}`] || import.meta.env[`REACT_APP_${key}`] || fallback;

export const API_BASE_URL_RAW = readEnv('BASE_URL', 'http://localhost:4000/');
export const CHAPA_PUBLIC_KEY = readEnv('CHAPA_PUBLIC_KEY', '');
