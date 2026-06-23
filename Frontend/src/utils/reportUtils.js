import { EthiopianDateUtil } from 'habesha-datepicker';

export const formatReportCurrency = (amount) =>
    new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
    }).format(amount || 0);

export const formatReportEthiopianDate = (dateString) => {
    const gregorianDate = new Date(dateString);
    const ethiopianDate = EthiopianDateUtil.toEth(gregorianDate);
    return EthiopianDateUtil.formatEtDate(ethiopianDate, 'EC');
};

export const groupDailyBreakdownByDate = (dailyBreakdown = []) => {
    const groupedByDate = {};

    dailyBreakdown.forEach((item) => {
        if (!groupedByDate[item.date]) {
            groupedByDate[item.date] = [];
        }
        groupedByDate[item.date].push(item);
    });

    return Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));
};

export const sumDailyParkedCars = (dailyBreakdown = []) =>
    dailyBreakdown.reduce((sum, item) => sum + (item.dailyParkedCar || 0), 0);

export const partitionUsersReport = (usersByType = []) => {
    const valetUsers = [];
    const administrativeUsers = [];

    usersByType.forEach((typeGroup) => {
        if (typeGroup.type === 'valet') {
            valetUsers.push(...typeGroup.users);
        } else if (typeGroup.type === 'system_admin' || typeGroup.type === 'manager') {
            administrativeUsers.push(...typeGroup.users.map((entry) => ({
                ...entry,
                role: typeGroup.type === 'system_admin' ? 'System Admin' : 'Manager',
            })));
        }
    });

    return { valetUsers, administrativeUsers };
};
