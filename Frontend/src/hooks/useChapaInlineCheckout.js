import { useCallback, useRef } from 'react';
import { CHAPA_INLINE_FORM_ID, loadChapaCheckout } from '../utils/chapaInline';

export const useChapaInlineCheckout = () => {
    const instanceRef = useRef(null);

    const cleanup = useCallback(() => {
        const container = document.getElementById(CHAPA_INLINE_FORM_ID);
        if (container) container.innerHTML = '';
        instanceRef.current = null;
    }, []);

    const openInlineCheckout = useCallback(async (config, { delayMs = 100 } = {}) => {
        const ChapaCheckout = await loadChapaCheckout();
        cleanup();

        const chapa = new ChapaCheckout(config);
        instanceRef.current = chapa;

        await new Promise((resolve, reject) => {
            setTimeout(() => {
                const container = document.getElementById(CHAPA_INLINE_FORM_ID);
                if (!container) {
                    reject(new Error('Failed to load payment form container'));
                    return;
                }
                try {
                    chapa.initialize(CHAPA_INLINE_FORM_ID);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, delayMs);
        });

        return chapa;
    }, [cleanup]);

    return {
        instanceRef,
        cleanup,
        openInlineCheckout,
    };
};
