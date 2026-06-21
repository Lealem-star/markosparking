export const calculateFlaggedFee = (car) => {
    let parkingFee = car.baseAmount || 0;
    let vatAmount = car.vatAmount || 0;
    let totalWithVat = parkingFee + vatAmount;

    if (totalWithVat === 0 && car.parkedAt && car.checkedOutAt) {
        const parkedAt = new Date(car.parkedAt);
        const checkedOutAt = new Date(car.checkedOutAt);
        const diffMs = checkedOutAt - parkedAt;
        const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
        const hoursParked = totalMinutes / 60;

        parkingFee = Math.round(hoursParked * 50 * 100) / 100;
        vatAmount = Math.round(parkingFee * 0.15 * 100) / 100;
        totalWithVat = Math.round((parkingFee + vatAmount) * 100) / 100;
    }

    return { parkingFee, vatAmount, totalWithVat };
};

export const getCarZone = (car, unknownZoneLabel) => {
    const zone = car.location || car.valet_id?.parkZoneCode;
    return zone?.trim() || unknownZoneLabel;
};

export const getLicensePlate = (car) =>
    car.licensePlate || `${car.plateCode || ''}-${car.region || ''}-${car.licensePlateNumber || ''}`.replace(/^-|-$/g, '') || 'N/A';

export const formatFlaggedDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const getFlaggedStats = (cars, unknownZoneLabel = 'Unknown') => {
    const zones = new Set(cars.map((car) => getCarZone(car, unknownZoneLabel)));
    const totalOutstanding = cars.reduce(
        (sum, car) => sum + calculateFlaggedFee(car).totalWithVat,
        0
    );

    return {
        totalFlagged: cars.length,
        zoneCount: zones.size,
        totalOutstanding: totalOutstanding.toFixed(2),
    };
};

export const groupFlaggedByZone = (cars, unknownZoneLabel) => {
    const grouped = cars.reduce((acc, car) => {
        const zone = getCarZone(car, unknownZoneLabel);
        if (!acc[zone]) acc[zone] = [];
        acc[zone].push(car);
        return acc;
    }, {});

    return Object.keys(grouped)
        .sort((a, b) => {
            if (a === unknownZoneLabel) return 1;
            if (b === unknownZoneLabel) return -1;
            return a.localeCompare(b);
        })
        .map((zoneCode) => ({
            zoneCode,
            cars: grouped[zoneCode],
            totalOutstanding: grouped[zoneCode].reduce(
                (sum, car) => sum + calculateFlaggedFee(car).totalWithVat,
                0
            ),
        }));
};

export const filterFlaggedCars = (cars, { searchQuery, zoneFilter, statusFilter }, unknownZoneLabel) => {
    const query = searchQuery.trim().toLowerCase();

    return cars.filter((car) => {
        const plate = getLicensePlate(car).toLowerCase();
        const phone = (car.phoneNumber || '').toLowerCase();
        const zone = getCarZone(car, unknownZoneLabel);

        const matchesSearch = !query || plate.includes(query) || phone.includes(query);
        const matchesZone = zoneFilter === 'all' || zone === zoneFilter;
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'notified' && car.notificationSent) ||
            (statusFilter === 'unpaid' && !car.notificationSent);

        return matchesSearch && matchesZone && matchesStatus;
    });
};

export const getUniqueZones = (cars, unknownZoneLabel) =>
    [...new Set(cars.map((car) => getCarZone(car, unknownZoneLabel)))].sort((a, b) => {
        if (a === unknownZoneLabel) return 1;
        if (b === unknownZoneLabel) return -1;
        return a.localeCompare(b);
    });

export const exportFlaggedCsv = (cars, t) => {
    const headers = [
        t('valet.licensePlate'),
        t('valet.phoneNumber'),
        t('valet.parkedAt'),
        t('valet.checkedOutAt'),
        t('valet.parkingFee'),
        t('valet.status'),
    ];

    const rows = cars.map((car) => {
        const fee = calculateFlaggedFee(car);
        return [
            getLicensePlate(car),
            car.phoneNumber || 'N/A',
            formatFlaggedDateTime(car.parkedAt),
            formatFlaggedDateTime(car.checkedOutAt),
            `${fee.totalWithVat.toFixed(2)} ETB`,
            car.notificationSent ? t('valet.statusNotified') : t('valet.statusUnpaid'),
        ];
    });

    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flagged-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};
