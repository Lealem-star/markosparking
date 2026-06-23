const PricingSettings = require('../models/pricingSettingsSchema');
const AppError = require('../errors/AppError');
const { calculateVAT, reverseCalculateVAT, getVATRate } = require('../utils/vatCalculator');

const DEFAULT_HOURLY_RATE = 50;

const getLicenseDisplay = (car) => {
    return car.licensePlate
        || `${car.plateCode || ''}-${car.region || ''}-${car.licensePlateNumber || ''}`;
};

const buildLicensePlate = (plateCode, region, licensePlateNumber) => {
    return `${plateCode}-${region}-${licensePlateNumber}`.toUpperCase();
};

const getHourlyRateForCarType = async (carType) => {
    const pricingSettings = await PricingSettings.findOne();
    const priceLevels = pricingSettings?.priceLevels || {};
    const priceLevelNames = Object.keys(priceLevels);

    if (priceLevelNames.length === 0) {
        return DEFAULT_HOURLY_RATE;
    }

    const carPricing = priceLevels[priceLevelNames[0]]?.[carType] || {};
    return carPricing.hourly || DEFAULT_HOURLY_RATE;
};

const calculateHoursParked = (parkedAt, checkedOutAt) => {
    const diffMs = new Date(checkedOutAt) - new Date(parkedAt);
    return Math.max(0.01, diffMs / (1000 * 60 * 60));
};

const calculateOutstandingAmount = async (car) => {
    if (car.baseAmount && car.vatAmount) {
        const parkingFee = car.baseAmount || 0;
        const vatAmount = car.vatAmount || 0;
        return {
            parkingFee,
            vatAmount,
            totalWithVat: parkingFee + vatAmount,
        };
    }

    if (car.totalPaidAmount === 0 && car.parkedAt && car.checkedOutAt) {
        const hoursParked = calculateHoursParked(car.parkedAt, car.checkedOutAt);
        const pricePerHour = await getHourlyRateForCarType(car.carType);
        const parkingFee = Math.round((hoursParked * pricePerHour) * 100) / 100;
        const vatRate = car.vatRate || await getVATRate();
        const vatAmount = Math.round(parkingFee * vatRate * 100) / 100;

        return {
            parkingFee,
            vatAmount,
            totalWithVat: parkingFee + vatAmount,
        };
    }

    return { parkingFee: 0, vatAmount: 0, totalWithVat: 0 };
};

const buildFlaggedCustomerError = async (flaggedCar) => {
    const { totalWithVat } = await calculateOutstandingAmount(flaggedCar);
    const licenseDisplay = getLicenseDisplay(flaggedCar);

    const error = new AppError(
        `This customer has an unpaid parking fee. Please ask them to pay the outstanding amount of ${totalWithVat.toFixed(2)} ETB first before registering a new car. License Plate: ${licenseDisplay}`,
        400
    );

    error.flaggedCar = {
        id: flaggedCar._id,
        licensePlate: licenseDisplay,
        phoneNumber: flaggedCar.phoneNumber,
        outstandingAmount: totalWithVat.toFixed(2),
    };

    return error;
};

module.exports = {
    getLicenseDisplay,
    buildLicensePlate,
    getHourlyRateForCarType,
    calculateHoursParked,
    calculateOutstandingAmount,
    buildFlaggedCustomerError,
    calculateVAT,
    reverseCalculateVAT,
    getVATRate,
};
