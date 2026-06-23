export const formatLastUpdated = () =>
    new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

export const parsePricingSettingsResponse = (data) => ({
    priceLevels: data?.priceLevels || {},
    vatRate: data?.vatRate !== undefined ? data.vatRate : 0.15,
    vatEnabled: data?.vatEnabled !== false,
    vatHistory: Array.isArray(data?.vatRateHistory) ? data.vatRateHistory : [],
});

export const buildPriceLevelsPayload = (updatedPriceLevels, carTypes, vatRate, vatEnabled) => {
    const settingsToSave = { priceLevels: {}, vatRate, vatEnabled };

    Object.keys(updatedPriceLevels).forEach((priceLevelName) => {
        const priceLevel = updatedPriceLevels[priceLevelName];
        settingsToSave.priceLevels[priceLevelName] = {};

        carTypes.forEach((carType) => {
            const carPricing = priceLevel[carType] || {};
            settingsToSave.priceLevels[priceLevelName][carType] = {
                hourly: carPricing.hourly ? parseFloat(carPricing.hourly) || 0 : 0,
                weekly: carPricing.weekly ? parseFloat(carPricing.weekly) || 0 : 0,
                monthly: carPricing.monthly ? parseFloat(carPricing.monthly) || 0 : 0,
                yearly: carPricing.yearly ? parseFloat(carPricing.yearly) || 0 : 0,
            };
        });
    });

    return settingsToSave;
};

export const validateVatPercentage = (vatInput) => {
    const vatPercentage = parseFloat(vatInput);
    if (Number.isNaN(vatPercentage) || vatPercentage < 0 || vatPercentage > 100) {
        return null;
    }
    return vatPercentage / 100;
};

export const validateNewPriceLevelName = (name, existingPriceLevels) => {
    const trimmed = name?.trim();
    if (!trimmed) return 'Price level name is required';
    if (existingPriceLevels[trimmed]) return 'Price level name already exists';
    return null;
};
