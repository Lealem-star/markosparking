const AUDIT_CATEGORIES = Object.freeze([
    'auth',
    'user',
    'parking',
    'payment',
    'pricing',
    'zone',
]);

const AUDIT_ACTIONS = Object.freeze({
    AUTH_LOGIN_SUCCESS: 'auth.login.success',
    AUTH_LOGIN_FAILED: 'auth.login.failed',
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DEACTIVATED: 'user.deactivated',
    USER_PASSWORD_RESET: 'user.password_reset',
    PARKING_REGISTERED: 'parking.registered',
    PARKING_CHECKOUT: 'parking.checkout',
    PARKING_DELETED: 'parking.deleted',
    PAYMENT_COMPLETED: 'payment.completed',
    PRICING_UPDATED: 'pricing.updated',
    VAT_UPDATED: 'vat.updated',
    VAT_TOGGLED: 'vat.toggled',
    ZONE_CREATED: 'zone.created',
    ZONE_UPDATED: 'zone.updated',
    ZONE_DELETED: 'zone.deleted',
    RECONCILIATION_SUBMITTED: 'reconciliation.submitted',
    RECONCILIATION_APPROVED: 'reconciliation.approved',
    RECONCILIATION_REJECTED: 'reconciliation.rejected',
});

const ACTION_CATEGORY_MAP = Object.freeze({
    [AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS]: 'auth',
    [AUDIT_ACTIONS.AUTH_LOGIN_FAILED]: 'auth',
    [AUDIT_ACTIONS.USER_CREATED]: 'user',
    [AUDIT_ACTIONS.USER_UPDATED]: 'user',
    [AUDIT_ACTIONS.USER_DEACTIVATED]: 'user',
    [AUDIT_ACTIONS.USER_PASSWORD_RESET]: 'user',
    [AUDIT_ACTIONS.PARKING_REGISTERED]: 'parking',
    [AUDIT_ACTIONS.PARKING_CHECKOUT]: 'parking',
    [AUDIT_ACTIONS.PARKING_DELETED]: 'parking',
    [AUDIT_ACTIONS.PAYMENT_COMPLETED]: 'payment',
    [AUDIT_ACTIONS.PRICING_UPDATED]: 'pricing',
    [AUDIT_ACTIONS.VAT_UPDATED]: 'pricing',
    [AUDIT_ACTIONS.VAT_TOGGLED]: 'pricing',
    [AUDIT_ACTIONS.ZONE_CREATED]: 'zone',
    [AUDIT_ACTIONS.ZONE_UPDATED]: 'zone',
    [AUDIT_ACTIONS.ZONE_DELETED]: 'zone',
    [AUDIT_ACTIONS.RECONCILIATION_SUBMITTED]: 'payment',
    [AUDIT_ACTIONS.RECONCILIATION_APPROVED]: 'payment',
    [AUDIT_ACTIONS.RECONCILIATION_REJECTED]: 'payment',
});

module.exports = {
    AUDIT_CATEGORIES,
    AUDIT_ACTIONS,
    ACTION_CATEGORY_MAP,
};
