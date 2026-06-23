import { useCallback, useState } from 'react';

const BANNER_DURATION_MS = 6000;

export const useBanner = () => {
    const [banner, setBanner] = useState(null);

    const showBanner = useCallback((message, type = 'error') => {
        setBanner({ message, type });
        setTimeout(() => setBanner(null), BANNER_DURATION_MS);
    }, []);

    const dismissBanner = useCallback(() => setBanner(null), []);

    return { banner, showBanner, dismissBanner };
};
