export const AUDIT_CATEGORIES = [
    'auth',
    'user',
    'parking',
    'payment',
    'pricing',
    'zone',
];

export const FINANCE_AUDIT_CATEGORIES = ['payment', 'pricing'];

export const AUDIT_ACTIONS = [
    'auth.login.success',
    'auth.login.failed',
    'user.created',
    'user.updated',
    'user.deactivated',
    'user.password_reset',
    'parking.registered',
    'parking.checkout',
    'parking.deleted',
    'payment.completed',
    'pricing.updated',
    'vat.updated',
    'vat.toggled',
    'zone.created',
    'zone.updated',
    'zone.deleted',
];

export const FINANCE_AUDIT_ACTIONS = [
    'payment.completed',
    'pricing.updated',
    'vat.updated',
    'vat.toggled',
];

export const formatAuditTimestamp = (value, locale) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatMetadataPreview = (metadata) => {
    if (!metadata || typeof metadata !== 'object') return '';
    try {
        const text = JSON.stringify(metadata, null, 2);
        return text.length > 500 ? `${text.slice(0, 500)}…` : text;
    } catch {
        return '';
    }
};
