import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'valet-light-mode';

export function useValetTheme() {
    const [lightMode, setLightModeState] = useState(() => {
        if (typeof window === 'undefined') return true;
        return localStorage.getItem(STORAGE_KEY) !== 'false';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(lightMode));
    }, [lightMode]);

    const toggleLightMode = useCallback(() => {
        setLightModeState((prev) => !prev);
    }, []);

    const setLightMode = useCallback((value) => {
        setLightModeState(Boolean(value));
    }, []);

    return { lightMode, toggleLightMode, setLightMode };
}
