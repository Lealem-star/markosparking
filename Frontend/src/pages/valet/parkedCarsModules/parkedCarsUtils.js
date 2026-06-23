import { getLicensePlate } from '../../../utils/carDisplay';

export const DEFAULT_PRICING_SETTINGS = {
    tripod: { hourly: 50, weekly: 0, monthly: 0, yearly: 0 },
    automobile: { hourly: 50, weekly: 0, monthly: 0, yearly: 0 },
    truck: { hourly: 75, weekly: 0, monthly: 0, yearly: 0 },
    trailer: { hourly: 100, weekly: 0, monthly: 0, yearly: 0 },
    special_vehicles: { hourly: 75, weekly: 0, monthly: 0, yearly: 0 },
};

export { getLicensePlate };

export const dedupeCars = (list) => {
    const seen = new Set();
    return list.filter((car) => {
        const plate = getLicensePlate(car);
        const parkedMin = car.parkedAt ? new Date(car.parkedAt).setSeconds(0, 0) : 0;
        const key = `${plate}|${parkedMin}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const canParkIn = (car) => {
    if (car.status !== 'checked_out') return false;
    if (car.serviceType === 'package' && car.packageEndDate) {
        return new Date(car.packageEndDate) > new Date();
    }
    return true;
};

export const filterParkedCars = (cars, { serviceFilter, searchQuery }) => {
    let result = cars;

    if (serviceFilter === 'hourly') {
        result = result.filter((car) => car.serviceType !== 'package');
    } else if (serviceFilter === 'package') {
        result = result.filter((car) => car.serviceType === 'package');
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return result;

    return result.filter((car) => {
        const plate = getLicensePlate(car).toLowerCase();
        const phone = (car.phoneNumber || '').toLowerCase();
        const model = (car.model || '').toLowerCase();
        return plate.includes(query) || phone.includes(query) || model.includes(query);
    });
};

export const calculateParkingFee = (car, pricingSettings) => {
    const parkedAt = new Date(car.parkedAt);
    const now = new Date();
    const diffMs = now - parkedAt;
    const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
    const durationHours = Math.floor(totalMinutes / 60);
    const durationMins = totalMinutes % 60;
    const durationText = `${durationHours} Hours ${durationMins} Min`;

    const valetPriceLevel = car.valet_id?.priceLevel || null;
    const carType = car.carType || 'automobile';

    let carPricing = {};
    if (valetPriceLevel && pricingSettings?.priceLevels?.[valetPriceLevel]) {
        carPricing = pricingSettings.priceLevels[valetPriceLevel][carType] || {};
    } else {
        const priceLevelNames = pricingSettings?.priceLevels ? Object.keys(pricingSettings.priceLevels) : [];
        if (priceLevelNames.length > 0) {
            carPricing = pricingSettings.priceLevels[priceLevelNames[0]][carType] || {};
        }
    }

    let parkingFee = 0;
    let pricePerHour = 0;

    if (car.serviceType === 'package' && car.packageDuration) {
        parkingFee = carPricing[car.packageDuration] || 0;
    } else {
        pricePerHour = carPricing.hourly || 50;
        const hoursParked = totalMinutes / 60;
        parkingFee = Math.round(hoursParked * pricePerHour * 100) / 100;
    }

    const vatRate = window.vatRate || 0.15;
    const vatAmount = Math.round(parkingFee * vatRate * 100) / 100;
    const totalWithVat = Math.round((parkingFee + vatAmount) * 100) / 100;

    return {
        hoursParked: totalMinutes / 60,
        pricePerHour,
        parkingFee,
        vatAmount,
        totalWithVat,
        durationText,
        parkedAt: parkedAt.toLocaleString(),
        checkedOutAt: now.toLocaleString(),
        serviceType: car.serviceType || 'hourly',
        packageDuration: car.packageDuration || null,
    };
};
