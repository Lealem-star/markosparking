const AppError = require('../errors/AppError');
const ParkedCar = require('../models/parkedCarSchema');
const User = require('../models/userSchema');

const getDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

const getFinancialDaily = async (query = {}) => {
const { date } = query;
        

        const targetDate = date ? new Date(date) : new Date();
        const { start, end } = getDateRange(targetDate, targetDate);

        const cars = await ParkedCar.find({
            checkedOutAt: { $gte: start, $lte: end },
            status: 'checked_out'
        }).populate('valet_id', 'name');

        const totalRevenue = cars.reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);
        const manualRevenue = cars
            .filter(car => !car.paymentMethod || car.paymentMethod === 'manual')
            .reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);
        const onlineRevenue = cars
            .filter(car => car.paymentMethod === 'online')
            .reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);

        // Revenue by valet
        const revenueByValet = {};
        cars.forEach(car => {
            const valetName = car.valet_id?.name || 'Unknown';
            if (!revenueByValet[valetName]) {
                revenueByValet[valetName] = { count: 0, revenue: 0, vat: 0 };
            }
            revenueByValet[valetName].count++;
            revenueByValet[valetName].revenue += car.totalPaidAmount || 0;
            revenueByValet[valetName].vat += car.vatAmount || 0;
        });

        return ({
            date: targetDate.toISOString().split('T')[0],
            totalRevenue,
            manualRevenue,
            onlineRevenue,
            totalTransactions: cars.length,
            revenueByValet: Object.entries(revenueByValet).map(([name, data]) => ({
                valetName: name,
                transactionCount: data.count,
                revenue: data.revenue,
                vat: data.vat
            }))
        });
};

const getFinancialPeriod = async (query = {}) => {
const { startDate, endDate, period } = query; // period: 'weekly', 'monthly', 'yearly', 'custom'
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            // Default to last 30 days
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            checkedOutAt: { $gte: start, $lte: end },
            status: 'checked_out'
        }).populate('valet_id', 'name parkZoneCode');

        const totalRevenue = cars.reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);
        const manualRevenue = cars
            .filter(car => !car.paymentMethod || car.paymentMethod === 'manual')
            .reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);
        const onlineRevenue = cars
            .filter(car => car.paymentMethod === 'online')
            .reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);

        // Group by valet and date for daily breakdown
        const valetDailyBreakdown = {};
        cars.forEach(car => {
            const valetId = car.valet_id?._id?.toString() || 'unknown';
            const valetName = car.valet_id?.name || 'Unknown';
            const parkZoneCode = car.valet_id?.parkZoneCode || 'N/A';
            const date = car.checkedOutAt.toISOString().split('T')[0];
            
            const key = `${valetId}_${date}`;
            if (!valetDailyBreakdown[key]) {
                valetDailyBreakdown[key] = {
                    parkZoneCode,
                    valetName,
                    date,
                    dailyParkedCar: 0,
                    dailyRevenue: 0,
                    dailyVAT: 0
                };
            }
            valetDailyBreakdown[key].dailyParkedCar++;
            valetDailyBreakdown[key].dailyRevenue += car.totalPaidAmount || 0;
            valetDailyBreakdown[key].dailyVAT += car.vatAmount || 0;
        });

        // Convert to array and sort
        const dailyBreakdown = Object.values(valetDailyBreakdown)
            .sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.valetName.localeCompare(b.valetName);
            });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            totalRevenue,
            manualRevenue,
            onlineRevenue,
            totalTransactions: cars.length,
            averageTransaction: cars.length > 0 ? totalRevenue / cars.length : 0,
            dailyBreakdown
        });
};

const getFinancialPlateCode = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            checkedOutAt: { $gte: start, $lte: end },
            status: 'checked_out'
        });

        const revenueByPlateCode = {};
        cars.forEach(car => {
            const plateCode = car.plateCode || 'Unknown';
            if (!revenueByPlateCode[plateCode]) {
                revenueByPlateCode[plateCode] = { revenue: 0, count: 0 };
            }
            revenueByPlateCode[plateCode].revenue += car.totalPaidAmount || 0;
            revenueByPlateCode[plateCode].count++;
        });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            revenueByPlateCode: Object.entries(revenueByPlateCode)
                .map(([plateCode, data]) => ({
                    plateCode,
                    revenue: data.revenue,
                    transactionCount: data.count,
                    averageRevenue: data.count > 0 ? data.revenue / data.count : 0
                }))
                .sort((a, b) => b.revenue - a.revenue)
        });
};

const getFinancialPaymentMethods = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            checkedOutAt: { $gte: start, $lte: end },
            status: 'checked_out'
        });

        const manual = cars.filter(car => !car.paymentMethod || car.paymentMethod === 'manual');
        const online = cars.filter(car => car.paymentMethod === 'online');

        const manualRevenue = manual.reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);
        const onlineRevenue = online.reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            manual: {
                count: manual.length,
                revenue: manualRevenue,
                averageTransaction: manual.length > 0 ? manualRevenue / manual.length : 0,
                percentage: cars.length > 0 ? (manual.length / cars.length) * 100 : 0
            },
            online: {
                count: online.length,
                revenue: onlineRevenue,
                averageTransaction: online.length > 0 ? onlineRevenue / online.length : 0,
                percentage: cars.length > 0 ? (online.length / cars.length) * 100 : 0
            },
            total: {
                count: cars.length,
                revenue: manualRevenue + onlineRevenue
            }
        });
};

const getOperationalActivity = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const totalParked = await ParkedCar.countDocuments({
            parkedAt: { $gte: start, $lte: end }
        });

        const checkedOut = await ParkedCar.countDocuments({
            parkedAt: { $gte: start, $lte: end },
            status: 'checked_out'
        });

        const stillParked = await ParkedCar.countDocuments({
            parkedAt: { $gte: start, $lte: end },
            status: 'parked'
        });

        const violations = await ParkedCar.countDocuments({
            parkedAt: { $gte: start, $lte: end },
            status: 'violation'
        });

        // Daily activity breakdown
        const dailyActivity = {};
        const cars = await ParkedCar.find({
            parkedAt: { $gte: start, $lte: end }
        });

        cars.forEach(car => {
            const date = car.parkedAt.toISOString().split('T')[0];
            if (!dailyActivity[date]) {
                dailyActivity[date] = { parked: 0, checkedOut: 0, violations: 0 };
            }
            dailyActivity[date].parked++;
            if (car.status === 'checked_out') dailyActivity[date].checkedOut++;
            if (car.status === 'violation') dailyActivity[date].violations++;
        });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            totalParked,
            checkedOut,
            stillParked,
            violations,
            checkoutRate: totalParked > 0 ? (checkedOut / totalParked) * 100 : 0,
            dailyActivity: Object.entries(dailyActivity)
                .map(([date, data]) => ({ date, ...data }))
                .sort((a, b) => a.date.localeCompare(b.date))
        });
};

const getOperationalDuration = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            checkedOutAt: { $gte: start, $lte: end },
            status: 'checked_out',
            checkedOutAt: { $exists: true }
        });

        const durations = cars.map(car => {
            const duration = (car.checkedOutAt - car.parkedAt) / (1000 * 60 * 60); // hours
            return duration;
        }).filter(d => d > 0);

        const avgDuration = durations.length > 0 
            ? durations.reduce((a, b) => a + b, 0) / durations.length 
            : 0;

        const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
        const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

        // Duration distribution
        const distribution = {
            '0-1': 0,
            '1-3': 0,
            '3-6': 0,
            '6-12': 0,
            '12-24': 0,
            '24+': 0
        };

        durations.forEach(d => {
            if (d < 1) distribution['0-1']++;
            else if (d < 3) distribution['1-3']++;
            else if (d < 6) distribution['3-6']++;
            else if (d < 12) distribution['6-12']++;
            else if (d < 24) distribution['12-24']++;
            else distribution['24+']++;
        });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            totalCheckedOut: cars.length,
            averageDuration: avgDuration,
            minDuration,
            maxDuration,
            distribution
        });
};

const getOperationalLocation = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            parkedAt: { $gte: start, $lte: end }
        });

        const locationStats = {};
        cars.forEach(car => {
            const location = car.location || 'Unknown';
            if (!locationStats[location]) {
                locationStats[location] = { total: 0, checkedOut: 0, stillParked: 0 };
            }
            locationStats[location].total++;
            if (car.status === 'checked_out') locationStats[location].checkedOut++;
            if (car.status === 'parked') locationStats[location].stillParked++;
        });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            locationStats: Object.entries(locationStats)
                .map(([location, data]) => ({
                    location,
                    totalParked: data.total,
                    checkedOut: data.checkedOut,
                    stillParked: data.stillParked,
                    utilizationRate: data.total > 0 ? (data.checkedOut / data.total) * 100 : 0
                }))
                .sort((a, b) => b.totalParked - a.totalParked)
        });
};

const getOperationalPeakHours = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            parkedAt: { $gte: start, $lte: end }
        });

        const hourlyStats = {};
        for (let i = 0; i < 24; i++) {
            hourlyStats[i] = { parked: 0, checkedOut: 0 };
        }

        cars.forEach(car => {
            const hour = car.parkedAt.getHours();
            hourlyStats[hour].parked++;
            if (car.status === 'checked_out' && car.checkedOutAt) {
                const checkoutHour = car.checkedOutAt.getHours();
                hourlyStats[checkoutHour].checkedOut++;
            }
        });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            hourlyStats: Object.entries(hourlyStats)
                .map(([hour, data]) => ({
                    hour: parseInt(hour),
                    hourLabel: `${hour}:00`,
                    parked: data.parked,
                    checkedOut: data.checkedOut
                }))
                .sort((a, b) => a.hour - b.hour)
        });
};

const getOperationalPlateCodeDistribution = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            parkedAt: { $gte: start, $lte: end }
        });

        const plateCodeStats = {};
        cars.forEach(car => {
            const plateCode = car.plateCode || 'Unknown';
            if (!plateCodeStats[plateCode]) {
                plateCodeStats[plateCode] = { count: 0, regions: {} };
            }
            plateCodeStats[plateCode].count++;
            const region = car.region || 'Unknown';
            if (!plateCodeStats[plateCode].regions[region]) {
                plateCodeStats[plateCode].regions[region] = 0;
            }
            plateCodeStats[plateCode].regions[region]++;
        });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            plateCodeStats: Object.entries(plateCodeStats)
                .map(([plateCode, data]) => ({
                    plateCode,
                    count: data.count,
                    percentage: cars.length > 0 ? (data.count / cars.length) * 100 : 0,
                    regions: Object.entries(data.regions)
                        .map(([region, count]) => ({ region, count }))
                        .sort((a, b) => b.count - a.count)
                }))
                .sort((a, b) => b.count - a.count)
        });
};

const getCustomerVehicleHistory = async (query = {}) => {
const { licensePlate, phoneNumber } = query;

        if (!licensePlate && !phoneNumber) {
            throw new AppError('licensePlate or phoneNumber is required', 400);
        }
        let dbQuery = {};
        if (licensePlate) {
            dbQuery.licensePlate = licensePlate.toUpperCase();
        }
        if (phoneNumber) {
            dbQuery.phoneNumber = phoneNumber;
        }

        const cars = await ParkedCar.find(dbQuery)
            .populate('valet_id', 'name')
            .populate('checkedOutBy', 'name')
            .sort({ parkedAt: -1 });

        const totalVisits = cars.length;
        const totalPaid = cars
            .filter(car => car.status === 'checked_out')
            .reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);

        return ({
            searchCriteria: { licensePlate, phoneNumber },
            totalVisits,
            totalPaid,
            averagePayment: cars.filter(c => c.status === 'checked_out').length > 0
                ? totalPaid / cars.filter(c => c.status === 'checked_out').length
                : 0,
            history: cars.map(car => ({
                id: car._id,
                licensePlate: car.licensePlate,
                plateCode: car.plateCode,
                region: car.region,
                model: car.model,
                color: car.color,
                parkedAt: car.parkedAt,
                checkedOutAt: car.checkedOutAt,
                status: car.status,
                location: car.location,
                valetName: car.valet_id?.name,
                checkedOutByName: car.checkedOutBy?.name,
                paymentMethod: car.paymentMethod,
                totalPaidAmount: car.totalPaidAmount || 0,
                duration: car.checkedOutAt && car.parkedAt
                    ? ((car.checkedOutAt - car.parkedAt) / (1000 * 60 * 60)).toFixed(2) + ' hours'
                    : null
            }))
        });
};

const getCustomerActivity = async (query = {}) => {
const { startDate, endDate, minVisits } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const cars = await ParkedCar.find({
            parkedAt: { $gte: start, $lte: end }
        });

        const customerStats = {};
        cars.forEach(car => {
            const phone = car.phoneNumber || 'Unknown';
            if (!customerStats[phone]) {
                customerStats[phone] = {
                    phoneNumber: phone,
                    visitCount: 0,
                    totalPaid: 0,
                    lastVisit: null,
                    preferredPaymentMethod: {}
                };
            }
            customerStats[phone].visitCount++;
            if (car.status === 'checked_out' && car.totalPaidAmount) {
                customerStats[phone].totalPaid += car.totalPaidAmount;
            }
            if (!customerStats[phone].lastVisit || car.parkedAt > customerStats[phone].lastVisit) {
                customerStats[phone].lastVisit = car.parkedAt;
            }
            const paymentMethod = car.paymentMethod || 'manual';
            customerStats[phone].preferredPaymentMethod[paymentMethod] = 
                (customerStats[phone].preferredPaymentMethod[paymentMethod] || 0) + 1;
        });

        let customers = Object.values(customerStats);
        if (minVisits) {
            customers = customers.filter(c => c.visitCount >= parseInt(minVisits));
        }

        customers = customers
            .map(c => ({
                ...c,
                preferredPaymentMethod: Object.entries(c.preferredPaymentMethod)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'manual',
                averagePayment: c.visitCount > 0 ? c.totalPaid / c.visitCount : 0
            }))
            .sort((a, b) => b.visitCount - a.visitCount);

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            totalCustomers: customers.length,
            customers
        });
};

const getAdministrativeUsers = async (query = {}) => {
const users = await User.find({}).select('-password');

        const usersByType = {};
        users.forEach(user => {
            const type = user.type || 'unknown';
            if (!usersByType[type]) {
                usersByType[type] = [];
            }
            usersByType[type].push({
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                parkZoneCode: user.parkZoneCode,
                type: user.type,
                hasProfilePhoto: !!user.profilePhoto
            });
        });

        // Get activity stats for each user
        const userActivity = await Promise.all(
            users.map(async (user) => {
                const carsParked = await ParkedCar.countDocuments({ valet_id: user._id });
                const carsCheckedOut = await ParkedCar.countDocuments({
                    valet_id: user._id,
                    status: 'checked_out'
                });
                return {
                    userId: user._id.toString(),
                    carsParked,
                    carsCheckedOut
                };
            })
        );

        const activityMap = {};
        userActivity.forEach(activity => {
            activityMap[activity.userId] = activity;
        });

        return ({
            totalUsers: users.length,
            usersByType: Object.entries(usersByType).map(([type, userList]) => ({
                type,
                count: userList.length,
                users: userList.map(u => ({
                    ...u,
                    activity: activityMap[u.id] || { carsParked: 0, carsCheckedOut: 0 }
                }))
            }))
        });
};

const getAdministrativeValetPerformance = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const valets = await User.find({ type: 'valet' });
        const performance = await Promise.all(
            valets.map(async (valet) => {
                const carsParked = await ParkedCar.countDocuments({
                    valet_id: valet._id,
                    parkedAt: { $gte: start, $lte: end }
                });

                const carsCheckedOut = await ParkedCar.countDocuments({
                    valet_id: valet._id,
                    checkedOutAt: { $gte: start, $lte: end },
                    status: 'checked_out'
                });

                const cars = await ParkedCar.find({
                    valet_id: valet._id,
                    checkedOutAt: { $gte: start, $lte: end },
                    status: 'checked_out'
                });

                const revenue = cars.reduce((sum, car) => sum + (car.totalPaidAmount || 0), 0);

                return {
                    valetId: valet._id,
                    valetName: valet.name,
                    phoneNumber: valet.phoneNumber,
                    parkZoneCode: valet.parkZoneCode,
                    carsParked,
                    carsCheckedOut,
                    revenue,
                    averageRevenue: carsCheckedOut > 0 ? revenue / carsCheckedOut : 0,
                    checkoutRate: carsParked > 0 ? (carsCheckedOut / carsParked) * 100 : 0
                };
            })
        );

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            performance: performance.sort((a, b) => b.revenue - a.revenue)
        });
};

const getComplianceTransactions = async (query = {}) => {
const { startDate, endDate, paymentMethod } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        let dbQuery = {
            checkedOutAt: { $gte: start, $lte: end },
            status: 'checked_out'
        };

        if (paymentMethod) {
            if (paymentMethod === 'manual') {
                dbQuery.$or = [
                    { paymentMethod: 'manual' },
                    { paymentMethod: { $exists: false } },
                    { paymentMethod: null }
                ];
            } else {
                dbQuery.paymentMethod = paymentMethod;
            }
        }

        const cars = await ParkedCar.find(dbQuery)
            .populate('valet_id', 'name phoneNumber')
            .populate('checkedOutBy', 'name phoneNumber')
            .sort({ checkedOutAt: -1 });

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            paymentMethod: paymentMethod || 'all',
            totalTransactions: cars.length,
            transactions: cars.map(car => ({
                id: car._id,
                licensePlate: car.licensePlate,
                plateCode: car.plateCode,
                parkedAt: car.parkedAt,
                checkedOutAt: car.checkedOutAt,
                paymentMethod: car.paymentMethod || 'manual',
                paymentReference: car.paymentReference,
                amount: car.totalPaidAmount || 0,
                valetName: car.valet_id?.name,
                checkedOutByName: car.checkedOutBy?.name,
                location: car.location
            }))
        });
};

const getComplianceSystemActivity = async (query = {}) => {
const { startDate, endDate } = query;
        

        let start, end;
        if (startDate && endDate) {
            const range = getDateRange(startDate, endDate);
            start = range.start;
            end = range.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        // Get all cars in the period
        const allCars = await ParkedCar.find({
            $or: [
                { parkedAt: { $gte: start, $lte: end } },
                { checkedOutAt: { $gte: start, $lte: end } }
            ]
        })
        .populate('valet_id', 'name')
        .populate('checkedOutBy', 'name')
        .sort({ parkedAt: -1 });

        // Activity summary
        const activitySummary = {
            carsRegistered: allCars.filter(c => c.parkedAt >= start && c.parkedAt <= end).length,
            carsCheckedOut: allCars.filter(c => c.checkedOutAt >= start && c.checkedOutAt <= end).length,
            totalRevenue: allCars
                .filter(c => c.status === 'checked_out' && c.checkedOutAt >= start && c.checkedOutAt <= end)
                .reduce((sum, c) => sum + (c.totalPaidAmount || 0), 0),
            violations: allCars.filter(c => c.status === 'violation').length
        };

        return ({
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
            activitySummary,
            activities: allCars.map(car => ({
                id: car._id,
                action: car.status === 'checked_out' ? 'checkout' : car.status === 'violation' ? 'violation' : 'park',
                licensePlate: car.licensePlate,
                timestamp: car.status === 'checked_out' && car.checkedOutAt ? car.checkedOutAt : car.parkedAt,
                performedBy: car.status === 'checked_out' && car.checkedOutBy ? car.checkedOutBy.name : car.valet_id?.name,
                amount: car.totalPaidAmount || 0,
                paymentMethod: car.paymentMethod || 'manual'
            }))
        });
};
module.exports = {
    getDateRange,
    getFinancialDaily,
    getFinancialPeriod,
    getFinancialPlateCode,
    getFinancialPaymentMethods,
    getOperationalActivity,
    getOperationalDuration,
    getOperationalLocation,
    getOperationalPeakHours,
    getOperationalPlateCodeDistribution,
    getCustomerVehicleHistory,
    getCustomerActivity,
    getAdministrativeUsers,
    getAdministrativeValetPerformance,
    getComplianceTransactions,
    getComplianceSystemActivity,
};
