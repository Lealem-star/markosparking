import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'parking-officer-light-mode';
const LEGACY_STORAGE_KEY = 'valet-light-mode';

export function useParkingOfficerTheme() {
    const [lightMode, setLightModeState] = useState(() => {
        if (typeof window === 'undefined') return true;
        const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
        return stored !== 'false';
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

/** @deprecated use useParkingOfficerTheme */
export const useValetTheme = useParkingOfficerTheme;
