const STORAGE_KEY = 'markos_payment_success_pending';
export const PAYMENT_SUCCESS_EVENT = 'markos-payment-success-queued';
const MAX_AGE_MS = 10 * 60 * 1000;

export function queuePaymentSuccess({ message, amount, navigateTo = null }) {
    sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            message,
            amount: amount ?? null,
            navigateTo,
            queuedAt: Date.now(),
        })
    );
    window.dispatchEvent(new Event(PAYMENT_SUCCESS_EVENT));
}

export function readPaymentSuccess() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        const data = JSON.parse(raw);
        if (!data?.queuedAt || Date.now() - data.queuedAt > MAX_AGE_MS) {
            sessionStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return data;
    } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export function consumePaymentSuccess() {
    const data = readPaymentSuccess();
    if (data) {
        sessionStorage.removeItem(STORAGE_KEY);
    }
    return data;
}
