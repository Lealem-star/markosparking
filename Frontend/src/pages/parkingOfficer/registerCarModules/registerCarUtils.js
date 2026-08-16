export const DEFAULT_PLATE_CODES = [
    '01', '02', '03', '04', '05', 'police', 'AO', 'ተላላፊ', 'የእለት', 'DF', 'AU', 'AU-CD', 'UN', 'UN-CD', 'CD',
];

export const REGIONS = [
    'ET', 'AA', 'AF', 'AM', 'BG', 'DR', 'GM', 'HR', 'OR', 'SM', 'TG', 'SD', 'DE', 'ME', 'DM',
];

export const CAR_TYPES = ['tripod', 'automobile', 'truck', 'trailer', 'special_vehicles'];

export const PACKAGE_DURATIONS = ['weekly', 'monthly', 'yearly'];

export const EMPTY_FORM = {
    plateCode: '',
    region: '',
    licensePlateNumber: '',
    carType: '',
    model: '',
    color: '',
    phoneNumber: '',
    notes: '',
};

export { getFormLicenseDisplay } from '../../../utils/carDisplay';

export const calculatePackageFee = (carType, duration, pricingSettings, userPriceLevel) => {
    const priceLevels = pricingSettings?.priceLevels || {};
    const priceLevelNames = Object.keys(priceLevels);

    const priceLevelToUse = userPriceLevel && priceLevels[userPriceLevel]
        ? userPriceLevel
        : (priceLevelNames.length > 0 ? priceLevelNames[0] : null);

    if (!priceLevelToUse) return null;

    const carPricing = priceLevels[priceLevelToUse]?.[carType] || {};
    const packagePrice = carPricing[duration];

    if (packagePrice === undefined || packagePrice === null || Number.isNaN(Number(packagePrice))) {
        return null;
    }

    const priceNumber = Number(packagePrice);
    const vatRate = window.vatRate || 0.15;
    const vatAmount = Math.round(priceNumber * vatRate * 100) / 100;
    const totalWithVat = Math.round((priceNumber + vatAmount) * 100) / 100;

    return {
        totalWithVat,
        priceLevelUsed: priceLevelToUse,
    };
};

export const resolvePlateCodesFromPricing = (data) => {
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return DEFAULT_PLATE_CODES;
    }

    const hasCarTypes = CAR_TYPES.some((type) => data[type]);
    if (!hasCarTypes && !data.priceLevels) {
        return Object.keys(data);
    }

    return DEFAULT_PLATE_CODES;
};
