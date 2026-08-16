import axios from 'axios';
import { store, clearUser } from '../store';
import { queryClient } from './queryClient';

let isLoggingOut = false;

const AUTH_EXEMPT_URLS = [
    /\/user\/login(?:\?|$)/,
    /\/user\/register(?:\?|$)/,
];

const isAuthExemptRequest = (url = '') =>
    AUTH_EXEMPT_URLS.some((pattern) => pattern.test(url));

export const clearAuthSession = () => {
    store.dispatch(clearUser());
    queryClient.clear();
};

export const forceLogout = () => {
    if (isLoggingOut) return;
    isLoggingOut = true;

    clearAuthSession();

    if (window.location.pathname !== '/') {
        window.location.replace('/');
        return;
    }

    isLoggingOut = false;
};

export const setupAuthInterceptor = () => {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            const status = error?.response?.status;
            const requestUrl = error?.config?.url || '';
            const hadSession = Boolean(store.getState()?.user?.token);

            if (status === 401 && hadSession && !isAuthExemptRequest(requestUrl)) {
                forceLogout();
            }

            return Promise.reject(error);
        }
    );
};
