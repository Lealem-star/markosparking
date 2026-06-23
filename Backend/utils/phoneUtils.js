const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return phoneNumber;

    let normalized = phoneNumber.replace(/[\s\-()]/g, '').trim();

    if (normalized.startsWith('0') && normalized.length === 10) {
        normalized = '+251' + normalized.substring(1);
    } else if (!normalized.startsWith('+') && normalized.length === 9) {
        normalized = '+251' + normalized;
    } else if (!normalized.startsWith('+') && normalized.length === 12 && normalized.startsWith('251')) {
        normalized = '+' + normalized;
    }

    return normalized;
};

module.exports = { normalizePhoneNumber };
