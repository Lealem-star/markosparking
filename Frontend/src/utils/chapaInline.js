export const CHAPA_INLINE_FORM_ID = 'chapa-inline-form';
const CHAPA_LOAD_TIMEOUT_MS = 3000;
const CHAPA_LOAD_POLL_MS = 100;

export const formatChapaAmount = (amount) => {
    const amountNum = parseFloat(amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
        throw new Error(`Invalid amount: ${amount}`);
    }
    return amountNum.toFixed(2);
};

export const isChapaTestMode = (publicKey) => publicKey?.startsWith('CHAPUBK_TEST-');

export const validateChapaPublicKey = (publicKey) => {
    if (!publicKey) return { valid: false, reason: 'missing' };
    if (publicKey.startsWith('CHAPUBK_TEST-')) return { valid: true, mode: 'test' };
    if (publicKey.startsWith('CHAPUBK-') || publicKey.startsWith('CHAPUBK_LIVE-')) {
        return { valid: true, mode: 'live' };
    }
    return { valid: false, reason: 'invalid_format' };
};

export const formatPhoneForChapa = (phone, publicKey) => {
    if (!phone) return phone;

    const testMode = isChapaTestMode(publicKey);
    let formattedPhone = phone;

    if (testMode) {
        if (formattedPhone.startsWith('+251')) {
            formattedPhone = `0${formattedPhone.substring(4)}`;
        } else if (!formattedPhone.startsWith('0')) {
            formattedPhone = `0${formattedPhone}`;
        }
        return formattedPhone;
    }

    if (!formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.replace(/^0/, '+251');
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+251${formattedPhone}`;
        }
    }
    return formattedPhone;
};

export const buildChapaCustomerEmail = (phone, fallbackEmail) => {
    if (fallbackEmail) return fallbackEmail;
    const digits = (phone || '').replace(/[^0-9]/g, '') || 'customer';
    return `${digits}@tana-parking.com`;
};

export const loadChapaCheckout = () =>
    new Promise((resolve, reject) => {
        if (window.ChapaCheckout && typeof window.ChapaCheckout === 'function') {
            resolve(window.ChapaCheckout);
            return;
        }

        let attempts = 0;
        const maxAttempts = CHAPA_LOAD_TIMEOUT_MS / CHAPA_LOAD_POLL_MS;
        const interval = setInterval(() => {
            attempts += 1;
            if (window.ChapaCheckout && typeof window.ChapaCheckout === 'function') {
                clearInterval(interval);
                resolve(window.ChapaCheckout);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                reject(new Error('Chapa library failed to load'));
            }
        }, CHAPA_LOAD_POLL_MS);
    });

export const buildStandardChapaConfig = ({
    publicKey,
    txRef,
    amount,
    phoneNumber,
    email,
    description,
    callbackUrl,
    returnUrl,
    callbacks = {},
    customizations = {},
}) => {
    const formattedAmount = formatChapaAmount(amount);
    const formattedPhone = formatPhoneForChapa(phoneNumber, publicKey);
    const resolvedEmail = buildChapaCustomerEmail(formattedPhone, email);

    return {
        publicKey,
        public_key: publicKey,
        txRef,
        tx_ref: txRef,
        amount: formattedAmount,
        currency: 'ETB',
        phoneNumber: formattedPhone,
        phone_number: formattedPhone,
        firstName: 'Customer',
        lastName: 'User',
        first_name: 'Customer',
        last_name: 'User',
        email: resolvedEmail,
        availablePaymentMethods: ['telebirr', 'cbebirr', 'ebirr', 'mpesa'],
        customizations: {
            title: 'Tana Parking Payment',
            description,
            buttonText: 'Pay Now',
            ...customizations,
        },
        callbackUrl,
        callback_url: callbackUrl,
        returnUrl,
        return_url: returnUrl,
        showFlag: true,
        showPaymentMethodsNames: true,
        ...callbacks,
    };
};

export const clearChapaStorageKey = (storageKey) => {
    if (storageKey) localStorage.removeItem(storageKey);
};
