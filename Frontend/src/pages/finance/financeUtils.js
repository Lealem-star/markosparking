import { getTransactions } from '../../api/api';
import { getLicensePlate } from '../../utils/carDisplay';
import { calculateFlaggedFee } from '../shared/flaggedModules/flaggedUtils';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const AGING_BUCKETS = ['current', 'days8to30', 'days31to90', 'over90'];

export const getFlaggedReferenceDate = (car) =>
    car.flaggedAt || car.checkedOutAt || car.parkedAt || null;

export const getDaysOutstanding = (car, asOf = new Date()) => {
    const ref = getFlaggedReferenceDate(car);
    if (!ref) return 0;
    const diff = asOf.getTime() - new Date(ref).getTime();
    return Math.max(0, Math.floor(diff / MS_PER_DAY));
};

export const getReceivablesAging = (cars = [], asOf = new Date()) => {
    const buckets = {
        current: { count: 0, amount: 0 },
        days8to30: { count: 0, amount: 0 },
        days31to90: { count: 0, amount: 0 },
        over90: { count: 0, amount: 0 },
    };

    cars.forEach((car) => {
        const days = getDaysOutstanding(car, asOf);
        const amount = calculateFlaggedFee(car).totalWithVat;

        if (days <= 7) buckets.current.count += 1;
        else if (days <= 30) buckets.days8to30.count += 1;
        else if (days <= 90) buckets.days31to90.count += 1;
        else buckets.over90.count += 1;

        if (days <= 7) buckets.current.amount += amount;
        else if (days <= 30) buckets.days8to30.amount += amount;
        else if (days <= 90) buckets.days31to90.amount += amount;
        else buckets.over90.amount += amount;
    });

    return buckets;
};

const formatExportDateTime = (value) => {
    if (!value) return '';
    return new Date(value).toISOString();
};

export const exportTransactionsCsv = (items, t) => {
    const headers = [
        t('finance.checkoutTime'),
        t('valet.licensePlate'),
        t('admin.zone'),
        t('finance.amount'),
        t('dashboard.vat'),
        t('finance.paymentMethod'),
        t('dashboard.valetOfficerName'),
    ];

    const rows = items.map((car) => {
        const valet = car.valet_id || {};
        const method = car.paymentMethod === 'online' ? 'online' : 'manual';

        return [
            formatExportDateTime(car.checkedOutAt),
            getLicensePlate(car),
            car.location || '',
            (car.totalPaidAmount || 0).toFixed(2),
            (car.vatAmount || 0).toFixed(2),
            method === 'online' ? t('finance.paymentOnline') : t('finance.paymentManual'),
            valet.name || '',
        ];
    });

    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

export const fetchAllTransactions = async (token, filters = {}) => {
    const pageSize = 100;
    let page = 1;
    let totalPages = 1;
    const allItems = [];

    while (page <= totalPages) {
        const result = await getTransactions(token, {
            ...filters,
            page,
            limit: pageSize,
        });

        allItems.push(...(result.items || []));
        totalPages = result.totalPages || 1;
        page += 1;
    }

    return allItems;
};
