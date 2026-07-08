export const queryKeys = {
    parkedCars: (token, params = {}) => ['parkedCars', token, params.status ?? null, params.date ?? null],
    flaggedCars: (token) => ['flaggedCars', token],
    dailyStats: (token, date) => ['dailyStats', token, date],
    pricingSettings: () => ['pricingSettings'],
    parkZones: (token) => ['parkZones', token],
    users: (token) => ['users', token],
    periodRevenue: (token, startDate, endDate) => ['reports', 'periodRevenue', token, startDate, endDate],
    vehicleHistory: (token, params) => ['reports', 'vehicleHistory', token, params?.licensePlate ?? null, params?.phoneNumber ?? null],
    usersReport: (token) => ['reports', 'usersReport', token],
};
