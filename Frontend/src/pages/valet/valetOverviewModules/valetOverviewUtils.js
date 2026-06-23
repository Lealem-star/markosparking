import { getLicensePlate } from '../../../utils/carDisplay';

export const calculatePackageEndDate = (parkedAt, packageDuration) => {
    const startDate = new Date(parkedAt);
    const endDate = new Date(startDate);

    switch (packageDuration) {
        case 'weekly':
            endDate.setDate(startDate.getDate() + 7);
            break;
        case 'monthly':
            endDate.setMonth(startDate.getMonth() + 1);
            break;
        case 'yearly':
            endDate.setFullYear(startDate.getFullYear() + 1);
            break;
        default:
            return null;
    }

    return endDate;
};

export const aggregatePackageSubscriptions = (packageCars) => {
    const now = new Date();
    const subscriptionMap = {};

    packageCars.forEach((car) => {
        const subKey = car.packageSubscriptionId || `lp-${car.licensePlate}`;
        const packageEndDate = car.packageEndDate
            ? new Date(car.packageEndDate)
            : calculatePackageEndDate(car.parkedAt, car.packageDuration);

        if (!packageEndDate || packageEndDate <= now) {
            return;
        }

        if (!subscriptionMap[subKey]) {
            subscriptionMap[subKey] = {
                key: subKey,
                cars: [],
                packageDuration: car.packageDuration,
                phoneNumber: car.phoneNumber,
                packageEndDate,
            };
        }

        subscriptionMap[subKey].cars.push(car);
    });

    const activeSubscriptions = Object.values(subscriptionMap).map((sub) => {
        const isCurrentlyParked = sub.cars.some((c) => c.status === 'parked');
        const checkedOutCars = sub.cars.filter((c) => c.status === 'checked_out');
        const lastCheckedOutRecord = checkedOutCars.length > 0
            ? checkedOutCars.sort((a, b) => new Date(b.checkedOutAt || 0) - new Date(a.checkedOutAt || 0))[0]
            : null;

        return {
            ...sub,
            isCurrentlyParked,
            lastCheckedOutRecord,
            licensePlate: getLicensePlate(sub.cars[0]) || 'N/A',
        };
    });

    const stats = {
        weekly: activeSubscriptions.filter((s) => s.packageDuration === 'weekly').length,
        monthly: activeSubscriptions.filter((s) => s.packageDuration === 'monthly').length,
        yearly: activeSubscriptions.filter((s) => s.packageDuration === 'yearly').length,
        currentlyParked: packageCars.filter((car) => car.status === 'parked').length,
    };

    const subscriptions = activeSubscriptions.sort(
        (a, b) => b.packageEndDate - a.packageEndDate
    );

    return { stats, subscriptions };
};

export const filterSubscriptionsByPhone = (subscriptions, phoneFilter) => {
    const normalized = phoneFilter.trim().toLowerCase();
    if (!normalized) return subscriptions;

    return subscriptions.filter((sub) =>
        (sub.phoneNumber || '').toLowerCase().includes(normalized)
    );
};

export const formatOverviewDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
