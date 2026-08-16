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
        const id = car?._id?.toString();
        if (!id || seen.has(id)) return false;
        seen.add(id);
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

export const isSameVehicle = (a, b) => {
    if (!a || !b) return false;
    if (a._id && b._id && a._id.toString() === b._id.toString()) return true;

    const plateA = (a.licensePlate || '').toUpperCase();
    const plateB = (b.licensePlate || '').toUpperCase();
    if (plateA && plateB && plateA === plateB) return true;

    const numA = (a.licensePlateNumber || '').toUpperCase();
    const numB = (b.licensePlateNumber || '').toUpperCase();
    return Boolean(
        a.plateCode && b.plateCode
        && a.region && b.region
        && numA && numB
        && a.plateCode === b.plateCode
        && a.region === b.region
        && numA === numB
    );
};

export const hasActiveParkedVisit = (car, allCars = []) =>
    allCars.some(
        (other) => other.status === 'parked'
            && other._id?.toString() !== car._id?.toString()
            && isSameVehicle(other, car)
    );

export const canParkIn = (car, allCars = []) => {
    if (car.status !== 'checked_out') return false;
    if (hasActiveParkedVisit(car, allCars)) return false;
    if (car.serviceType === 'package' && car.packageEndDate) {
        return new Date(car.packageEndDate) > new Date();
    }
    return true;
};

export const filterParkedCars = (cars, { serviceFilter, searchQuery, statusFilter = 'all' }) => {
    let result = cars;

    if (statusFilter && statusFilter !== 'all') {
        result = result.filter((car) => car.status === statusFilter);
    }

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
