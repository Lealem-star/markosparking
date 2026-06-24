const { Types } = require('mongoose');
const ParkedCar = require('../models/parkedCarSchema');
const AppError = require('../errors/AppError');
const { sendSms } = require('./smsService');
const {
    buildLicensePlate,
    getLicenseDisplay,
    calculateOutstandingAmount,
    buildFlaggedCustomerError,
    reverseCalculateVAT,
    getVATRate,
} = require('./pricingService');

const ADMIN_ROLES = ['system_admin', 'manager', 'admin'];

const isAdminRole = (user) => ADMIN_ROLES.includes(user?.type);

const assertValet = (user) => {
    if (!user || user.type !== 'valet') {
        throw new AppError('Only valets can register parked cars', 403);
    }
};

const canManageCar = (currentUser, car) => {
    return isAdminRole(currentUser)
        || car.valet_id.toString() === currentUser._id.toString();
};

const populateCarQuery = (query) => query
    .populate('valet_id', 'name phoneNumber priceLevel')
    .populate('checkedOutBy', 'name phoneNumber');

const isUnpaidCheckedOutCar = (car) => {
    if (!car || car.status !== 'checked_out') return false;
    const paid = car.totalPaidAmount;
    return paid == null || paid <= 0;
};

const findFlaggedCustomer = async ({ licensePlate, plateCode, region, licensePlateNumber, phoneNumber }) => {
    return ParkedCar.findOne({
        isFlagged: true,
        $or: [
            { licensePlate },
            {
                plateCode,
                region,
                licensePlateNumber: licensePlateNumber.toUpperCase(),
            },
            { phoneNumber: phoneNumber.trim() },
        ],
    });
};

const sendPackageReParkSms = async (car) => {
    if (!car.phoneNumber) return;

    const now = new Date();
    const end = car.packageEndDate ? new Date(car.packageEndDate) : null;
    let remainingText = '';

    if (end) {
        const diffMs = end.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const endDisplay = end.toLocaleDateString();
        remainingText = `Package expires on ${endDisplay} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining).`;
    }

    const licenseDisplay = getLicenseDisplay(car);
    const smsMessage = `Security alert: Your package car (${licenseDisplay}) has been parked at Tana Parking.\nPackage type: ${car.packageDuration || 'package'}.\n${remainingText}`;

    await sendSms(car.phoneNumber, smsMessage);
};

// ─── Public API ───────────────────────────────────────────────────────────────

const registerParkedCar = async (valetUser, data) => {
    assertValet(valetUser);

    const {
        plateCode,
        region,
        licensePlateNumber,
        carType,
        model = '',
        color = '',
        phoneNumber,
        notes,
        serviceType = 'hourly',
        packageDuration,
    } = data;

    const licensePlate = buildLicensePlate(plateCode, region, licensePlateNumber);

    const existingCar = await ParkedCar.findOne({
        $or: [
            { licensePlate, status: 'parked' },
            {
                plateCode,
                region,
                licensePlateNumber: licensePlateNumber.toUpperCase(),
                status: 'parked',
            },
        ],
    });

    if (existingCar) {
        throw new AppError('Car with this license plate is already parked', 400);
    }

    const flaggedCar = await findFlaggedCustomer({
        licensePlate,
        plateCode,
        region,
        licensePlateNumber,
        phoneNumber,
    });

    if (flaggedCar) {
        throw await buildFlaggedCustomerError(flaggedCar);
    }

    const parkedCar = await ParkedCar.create({
        licensePlate,
        plateCode,
        region,
        licensePlateNumber: licensePlateNumber.toUpperCase(),
        carType,
        model,
        color,
        phoneNumber,
        location: valetUser.parkZoneCode || 'Unknown Zone',
        notes: notes || '',
        serviceType,
        packageDuration: serviceType === 'package' ? packageDuration : null,
        valet_id: valetUser._id,
        status: 'parked',
    });

    return populateCarQuery(ParkedCar.findById(parkedCar._id));
};

const listParkedCars = async (currentUser, { status, valet_id, date } = {}) => {
    const query = {};

    if (!isAdminRole(currentUser)) {
        query.valet_id = currentUser._id;
    } else if (valet_id) {
        query.valet_id = valet_id;
    }

    if (status) {
        query.status = status;
    }

    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        query.parkedAt = { $gte: startDate, $lte: endDate };
    }

    return populateCarQuery(ParkedCar.find(query)).sort({ parkedAt: -1 });
};

const getFlaggedCars = async () => {
    const query = {
        status: 'checked_out',
        $or: [
            { totalPaidAmount: { $exists: false } },
            { totalPaidAmount: null },
            { totalPaidAmount: { $lte: 0 } },
        ],
    };

    const cars = await ParkedCar.find(query)
        .populate('valet_id', 'name phoneNumber priceLevel parkZoneCode')
        .populate('flaggedBy', 'name phoneNumber')
        .populate('checkedOutBy', 'name phoneNumber')
        .sort({ flaggedAt: -1, checkedOutAt: -1 });

    console.log(`[Flagged Cars] Found ${cars.length} flagged/unpaid cars`);
    return cars;
};

const getParkedCarById = async (id) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid car id', 400);
    }

    const car = await populateCarQuery(ParkedCar.findById(id));
    if (!car) {
        throw new AppError('Parked car not found', 404);
    }

    return car;
};

const createPackageVisit = async (car, currentUser, notes) => {
    const newVisit = await ParkedCar.create({
        licensePlate: car.licensePlate,
        plateCode: car.plateCode,
        region: car.region,
        licensePlateNumber: car.licensePlateNumber,
        carType: car.carType,
        model: car.model,
        color: car.color,
        phoneNumber: car.phoneNumber,
        location: car.location,
        notes: notes !== undefined ? notes : car.notes,
        serviceType: 'package',
        packageDuration: car.packageDuration,
        packageSubscriptionId: car.packageSubscriptionId || car._id,
        packageStartDate: car.packageStartDate || car.parkedAt,
        packageEndDate: car.packageEndDate,
        valet_id: car.valet_id,
        status: 'parked',
        paymentMethod: car.paymentMethod,
        paymentReference: car.paymentReference,
        totalPaidAmount: car.totalPaidAmount || 0,
    });

    const populatedNewVisit = await populateCarQuery(ParkedCar.findById(newVisit._id));

    try {
        await sendPackageReParkSms(populatedNewVisit);
    } catch (smsErr) {
        console.error('Failed to send package re-park SMS:', smsErr);
    }

    return populatedNewVisit;
};

const applyHourlyCheckout = async (car, currentUser, { totalPaidAmount, paymentMethod }) => {
    car.status = 'checked_out';
    car.checkedOutAt = new Date();
    car.checkedOutBy = currentUser._id;

    if (totalPaidAmount !== undefined) {
        const vatRate = await getVATRate();
        const vatBreakdown = reverseCalculateVAT(totalPaidAmount, vatRate);
        car.totalPaidAmount = vatBreakdown.totalWithVat;
        car.baseAmount = vatBreakdown.baseAmount;
        car.vatAmount = vatBreakdown.vatAmount;
        car.vatRate = vatRate;
    }

    if (paymentMethod !== undefined) {
        car.paymentMethod = paymentMethod;
    }
};

const applyPackageCheckout = (car, currentUser, { totalPaidAmount, paymentMethod }) => {
    const now = new Date();
    car.status = 'checked_out';
    car.checkedOutAt = now;
    car.checkedOutBy = currentUser._id;

    if (totalPaidAmount !== undefined) {
        car.totalPaidAmount = totalPaidAmount;
    }
    if (paymentMethod !== undefined) {
        car.paymentMethod = paymentMethod;
    }
};

const applyFlaggingFields = (car, updates) => {
    const {
        isFlagged,
        flaggedAt,
        flaggedBy,
        baseAmount,
        vatAmount,
        notificationSent,
        lastNotificationSentAt,
    } = updates;

    if (baseAmount !== undefined) car.baseAmount = baseAmount;
    if (vatAmount !== undefined) car.vatAmount = vatAmount;

    if (isFlagged === false) {
        car.isFlagged = false;
        car.flaggedAt = null;
        car.flaggedBy = null;
        car.notificationSent = notificationSent !== undefined ? notificationSent : false;
        car.lastNotificationSentAt = lastNotificationSentAt !== undefined ? lastNotificationSentAt : null;
    } else if (isFlagged === true) {
        car.isFlagged = true;
    }

    if (flaggedAt !== undefined) car.flaggedAt = flaggedAt;
    if (flaggedBy !== undefined) car.flaggedBy = flaggedBy;

    if (notificationSent !== undefined && isFlagged !== false) {
        car.notificationSent = notificationSent;
    }
    if (lastNotificationSentAt !== undefined && isFlagged !== false) {
        car.lastNotificationSentAt = lastNotificationSentAt;
    }
};

const updateParkedCar = async (id, currentUser, updates) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid car id', 400);
    }

    const car = await ParkedCar.findById(id);
    if (!car) {
        throw new AppError('Parked car not found', 404);
    }

    const isFlaggedPaymentUpdate =
        car.isFlagged
        && car.status === 'checked_out'
        && (updates.totalPaidAmount !== undefined || updates.isFlagged === false);

    if (!isFlaggedPaymentUpdate && !canManageCar(currentUser, car)) {
        throw new AppError("You don't have permission to update this car", 403);
    }

    const { status, notes, totalPaidAmount, paymentMethod } = updates;

    if (status) {
        const isPackage = car.serviceType === 'package' && car.packageDuration && car.packageEndDate;

        if (!isPackage) {
            if (status === 'checked_out') {
                await applyHourlyCheckout(car, currentUser, { totalPaidAmount, paymentMethod });
            } else {
                car.status = status;
            }
        } else {
            const now = new Date();

            if (car.packageEndDate && now > car.packageEndDate) {
                throw new AppError('Package has expired', 400);
            }

            if (status === 'checked_out') {
                applyPackageCheckout(car, currentUser, { totalPaidAmount, paymentMethod });
            } else if (status === 'parked') {
                const newVisit = await createPackageVisit(car, currentUser, notes);
                return {
                    message: 'New package visit parked successfully',
                    car: newVisit,
                };
            }
        }
    }

    if (notes !== undefined) {
        car.notes = notes;
    }

    applyFlaggingFields(car, updates);

    if (car.status === 'checked_out' && car.totalPaidAmount > 0) {
        car.isFlagged = false;
        car.flaggedAt = null;
        car.flaggedBy = null;
    }

    await car.save();

    const updatedCar = await populateCarQuery(ParkedCar.findById(id));
    return {
        message: 'Parked car updated successfully',
        car: updatedCar,
    };
};

const deleteParkedCar = async (id, currentUser) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid car id', 400);
    }

    const car = await ParkedCar.findById(id);
    if (!car) {
        throw new AppError('Parked car not found', 404);
    }

    if (!canManageCar(currentUser, car)) {
        throw new AppError("You don't have permission to delete this car", 403);
    }

    await ParkedCar.findByIdAndDelete(id);
    return { message: 'Parked car deleted successfully' };
};

const getDailyStatsForDate = async (targetDate, currentUser) => {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const day = targetDate.getDate();

    const startDate = new Date(year, month, day, 0, 0, 0, 0);
    const endDate = new Date(year, month, day, 23, 59, 59, 999);

    let query = { parkedAt: { $gte: startDate, $lte: endDate } };

    if (!isAdminRole(currentUser)) {
        query.valet_id = currentUser._id;
    }

    const totalParked = await ParkedCar.countDocuments(query);
    const checkedOut = await ParkedCar.countDocuments({ ...query, status: 'checked_out' });
    const stillParked = await ParkedCar.countDocuments({ ...query, status: 'parked' });
    const violations = await ParkedCar.countDocuments({ ...query, status: 'violation' });

    let paymentQuery = {
        checkedOutAt: { $gte: startDate, $lte: endDate },
        status: 'checked_out',
    };

    if (!isAdminRole(currentUser)) {
        paymentQuery.valet_id = currentUser._id;
    }

    const manualPayments = await ParkedCar.aggregate([
        {
            $match: {
                ...paymentQuery,
                $or: [
                    { paymentMethod: 'manual' },
                    { paymentMethod: { $exists: false } },
                    { paymentMethod: null },
                ],
            },
        },
        { $group: { _id: null, total: { $sum: '$totalPaidAmount' } } },
    ]);

    const onlinePayments = await ParkedCar.aggregate([
        { $match: { ...paymentQuery, paymentMethod: 'online' } },
        { $group: { _id: null, total: { $sum: '$totalPaidAmount' } } },
    ]);

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return {
        date: dateStr,
        totalParked,
        checkedOut,
        stillParked,
        violations,
        manualPayments: manualPayments.length > 0 ? manualPayments[0].total : 0,
        onlinePayments: onlinePayments.length > 0 ? onlinePayments[0].total : 0,
    };
};

const getDailyStats = async (currentUser, date) => {
    let targetDate;
    if (date) {
        targetDate = new Date(date);
    } else {
        const now = new Date();
        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return getDailyStatsForDate(targetDate, currentUser);
};

const getDailyStatsHistory = async (currentUser, limit = 10) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const statsPromises = [];
    for (let i = 1; i <= parseInt(limit, 10); i++) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() - i);
        statsPromises.push(getDailyStatsForDate(targetDate, currentUser));
    }

    return Promise.all(statsPromises);
};

const flagCar = async (id, currentUser, { baseAmount, vatAmount, totalWithVat } = {}) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid car id', 400);
    }

    const car = await ParkedCar.findById(id);
    if (!car) {
        throw new AppError('Parked car not found', 404);
    }

    if (!canManageCar(currentUser, car)) {
        throw new AppError("You don't have permission to flag this car", 403);
    }

    const now = new Date();

    if (car.status === 'parked') {
        car.status = 'checked_out';
        car.checkedOutAt = now;
        car.checkedOutBy = currentUser._id;
    } else if (car.status === 'checked_out') {
        if (!car.checkedOutAt) car.checkedOutAt = now;
        if (!car.checkedOutBy) car.checkedOutBy = currentUser._id;
    } else {
        throw new AppError('Can only flag cars that are parked or checked out', 400);
    }

    car.isFlagged = true;
    car.flaggedAt = now;
    car.flaggedBy = currentUser._id;

    if (baseAmount !== undefined) car.baseAmount = baseAmount;
    if (vatAmount !== undefined) car.vatAmount = vatAmount;

    if (totalWithVat !== undefined) {
        car.totalPaidAmount = 0;
        if (!car.baseAmount && baseAmount === undefined) {
            const vatRate = car.vatRate || 0.15;
            const breakdown = reverseCalculateVAT(totalWithVat, vatRate);
            car.baseAmount = breakdown.baseAmount;
            car.vatAmount = breakdown.vatAmount;
        }
    }

    await car.save();

    const updatedCar = await ParkedCar.findById(id)
        .populate('valet_id', 'name phoneNumber priceLevel')
        .populate('checkedOutBy', 'name phoneNumber')
        .populate('flaggedBy', 'name phoneNumber');

    return { message: 'Car flagged successfully', car: updatedCar };
};

const notifyFlaggedCustomer = async (id) => {
    if (!Types.ObjectId.isValid(id)) {
        throw new AppError('Invalid car id', 400);
    }

    const car = await ParkedCar.findById(id)
        .populate('valet_id', 'name phoneNumber priceLevel');

    if (!car) {
        throw new AppError('Parked car not found', 404);
    }

    if (!isUnpaidCheckedOutCar(car)) {
        throw new AppError('Car is not eligible for notification', 400);
    }

    if (!car.phoneNumber) {
        throw new AppError('Phone number not available', 400);
    }

    let { parkingFee, vatAmount, totalWithVat } = await calculateOutstandingAmount(car);

    const licenseDisplay = getLicenseDisplay(car);
    const checkedOutDate = car.checkedOutAt
        ? new Date(car.checkedOutAt).toLocaleDateString()
        : 'N/A';
    const checkedOutTime = car.checkedOutAt
        ? new Date(car.checkedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    const smsMessage = `⚠️ WARNING: Unpaid Parking Fee\n\nDear customer,\n\nYour vehicle (${licenseDisplay}) was checked out from Tana Parking on ${checkedOutDate} at ${checkedOutTime} without payment.\n\nOutstanding Amount:\nParking Fee: ${parkingFee.toFixed(2)} ETB\nVAT: ${vatAmount.toFixed(2)} ETB\nTotal: ${totalWithVat.toFixed(2)} ETB\n\nPlease return to the parking facility to complete your payment. Failure to pay may result in additional penalties.\n\nThank you for your cooperation.`;

    const sent = await sendSms(car.phoneNumber, smsMessage);
    if (!sent) {
        throw new AppError('SMS service not available', 500);
    }

    car.notificationSent = true;
    car.lastNotificationSentAt = new Date();
    await car.save();

    return { message: 'Notification sent successfully', car };
};

module.exports = {
    registerParkedCar,
    listParkedCars,
    getFlaggedCars,
    getParkedCarById,
    updateParkedCar,
    deleteParkedCar,
    getDailyStats,
    getDailyStatsHistory,
    flagCar,
    notifyFlaggedCustomer,
};
