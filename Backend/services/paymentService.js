const { Types } = require('mongoose');
const ParkedCar = require('../models/parkedCarSchema');
const PendingPackagePayment = require('../models/pendingPackagePaymentSchema');
const AppError = require('../errors/AppError');
const { buildFlaggedCustomerError } = require('./pricingService');
const { reverseCalculateVAT, getVATRate } = require('../utils/vatCalculator');
const { logAudit } = require('./auditLogService');
const { AUDIT_ACTIONS } = require('../constants/auditActions');
const { ROLES } = require('../constants/roles');
const {
    CHAPA_PUBLIC_KEY,
    isChapaConfigured,
    verifyTransaction,
    isPendingVerificationError,
} = require('./chapaClient');

// ─── Status helpers ───────────────────────────────────────────────────────────

const normalizeChapaStatus = (status) => {
    if (status === 'success' || status === 'successful') {
        return 'successful';
    }
    return status;
};

const buildPackageEndDate = (packageStartDate, packageDuration) => {
    const packageEndDate = new Date(packageStartDate);
    switch (packageDuration) {
        case 'weekly':
            packageEndDate.setDate(packageStartDate.getDate() + 7);
            break;
        case 'monthly':
            packageEndDate.setMonth(packageStartDate.getMonth() + 1);
            break;
        case 'yearly':
            packageEndDate.setFullYear(packageStartDate.getFullYear() + 1);
            break;
        default:
            break;
    }
    return packageEndDate;
};

const generateCarTxRef = (carId) => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `tana-${carId.substring(0, 10)}-${timestamp}-${randomSuffix}`;
};

const generatePackageTxRef = () => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `tana-pkg-${timestamp}-${randomSuffix}`;
};

// ─── Car payment state ────────────────────────────────────────────────────────

const canProcessCarPayment = (car) => {
    return car && (car.status === 'parked' || (car.status === 'checked_out' && car.isFlagged));
};

const applySuccessfulOnlinePayment = async (car, txRef, amount) => {
    if (car.status !== 'checked_out') {
        car.status = 'checked_out';
    }
    if (!car.checkedOutAt) {
        car.checkedOutAt = new Date();
    }
    car.paymentMethod = 'online';
    car.paymentReference = txRef;
    if (car.isFlagged) {
        car.isFlagged = false;
        car.flaggedAt = null;
        car.flaggedBy = null;
        car.notificationSent = false;
        car.lastNotificationSentAt = null;
    }
    if (amount) {
        const vatRate = await getVATRate();
        const vatBreakdown = reverseCalculateVAT(parseFloat(amount), vatRate);
        car.totalPaidAmount = vatBreakdown.totalWithVat;
        car.baseAmount = vatBreakdown.baseAmount;
        car.vatAmount = vatBreakdown.vatAmount;
        car.vatRate = vatRate;
    } else if ((car.baseAmount || 0) + (car.vatAmount || 0) > 0) {
        car.totalPaidAmount = (car.baseAmount || 0) + (car.vatAmount || 0);
    }
    car.pendingPaymentTxRef = null;
    await car.save();

    await logAudit({
        action: AUDIT_ACTIONS.PAYMENT_COMPLETED,
        actorName: 'Online Payment',
        summary: `Online payment completed for ${car.licensePlate}`,
        targetType: 'car',
        targetId: car._id,
        metadata: {
            licensePlate: car.licensePlate,
            amount: car.totalPaidAmount,
            paymentMethod: 'online',
            txRef,
        },
    });
};

// ─── Package payment ──────────────────────────────────────────────────────────

const findPackageCarByTxRef = async (txRef) => {
    return ParkedCar.findOne({
        serviceType: 'package',
        paymentReference: txRef,
    }).sort({ _id: -1 });
};

const createPackageCarFromPending = async ({ txRef, amountOverride }) => {
    const existingCar = await findPackageCarByTxRef(txRef);
    if (existingCar) {
        return { parkedCar: existingCar, wasExisting: true, missingPending: false };
    }

    const pending = await PendingPackagePayment.findOneAndDelete({ txRef });
    if (!pending) {
        const alreadyCreated = await findPackageCarByTxRef(txRef);
        return { parkedCar: alreadyCreated, wasExisting: !!alreadyCreated, missingPending: !alreadyCreated };
    }

    const {
        carData,
        packageDuration,
        amount: storedAmount,
        valetId,
        parkZoneCode,
    } = pending;

    const packageStartDate = new Date();
    const packageEndDate = buildPackageEndDate(packageStartDate, packageDuration);
    const packageSubscriptionId = new Types.ObjectId();
    const finalAmount = Number(amountOverride ?? storedAmount ?? 0);
    const normalizedAmount = Number.isFinite(finalAmount) ? finalAmount : 0;

    const parkedCar = await ParkedCar.create({
        licensePlate: `${carData.plateCode}-${carData.region}-${carData.licensePlateNumber}`.toUpperCase(),
        plateCode: carData.plateCode,
        region: carData.region,
        licensePlateNumber: carData.licensePlateNumber.toUpperCase(),
        carType: carData.carType,
        model: carData.model || '',
        color: carData.color || '',
        phoneNumber: carData.phoneNumber,
        location: parkZoneCode || 'Unknown Zone',
        notes: carData.notes || '',
        serviceType: 'package',
        packageDuration,
        packageSubscriptionId,
        packageStartDate,
        packageEndDate,
        valet_id: valetId,
        status: 'parked',
        paymentMethod: 'online',
        paymentReference: txRef,
        totalPaidAmount: normalizedAmount,
    });

    if (normalizedAmount > 0) {
        const vatRate = await getVATRate();
        const vatBreakdown = reverseCalculateVAT(normalizedAmount, vatRate);
        parkedCar.baseAmount = vatBreakdown.baseAmount;
        parkedCar.vatAmount = vatBreakdown.vatAmount;
        parkedCar.vatRate = vatRate;
        await parkedCar.save();
    }

    return { parkedCar, wasExisting: false, missingPending: false };
};

const resolveCarIdFromTransaction = async (transaction, queryCarId) => {
    if (queryCarId && Types.ObjectId.isValid(queryCarId)) {
        return queryCarId;
    }

    if (transaction.meta?.carId) {
        return transaction.meta.carId;
    }

    const txRefMatch = transaction.tx_ref?.match(/^tana-([a-f0-9]{10,24})-/);
    if (!txRefMatch) {
        return null;
    }

    const carIdPrefix = txRefMatch[1];
    if (carIdPrefix.length === 24 && Types.ObjectId.isValid(carIdPrefix)) {
        return carIdPrefix;
    }

    try {
        const cars = await ParkedCar.aggregate([
            { $addFields: { idString: { $toString: '$_id' } } },
            { $match: { idString: { $regex: `^${carIdPrefix}`, $options: 'i' } } },
            { $limit: 1 },
        ]);
        if (cars.length > 0 && cars[0]._id) {
            return cars[0]._id.toString();
        }
    } catch (aggregateError) {
        console.error(`[Payment Verify] Error finding car by prefix ${carIdPrefix}:`, aggregateError);
        try {
            const allCars = await ParkedCar.find({}).limit(100);
            const matchingCar = allCars.find((car) => car._id.toString().startsWith(carIdPrefix));
            if (matchingCar) {
                return matchingCar._id.toString();
            }
        } catch (fallbackError) {
            console.error('[Payment Verify] Fallback search also failed:', fallbackError);
        }
    }

    return null;
};

const assertChapaConfigured = () => {
    if (!isChapaConfigured()) {
        throw new AppError('Payment service is temporarily unavailable. Please try again.', 500);
    }
};

// ─── Public API ───────────────────────────────────────────────────────────────

const initializeParkingPayment = async (carId) => {
    if (!Types.ObjectId.isValid(carId)) {
        throw new AppError('Invalid car id', 400);
    }

    const car = await ParkedCar.findById(carId);
    if (!car) {
        throw new AppError('Car not found', 404);
    }

    if (!canProcessCarPayment(car)) {
        throw new AppError('Car is not currently parked or flagged for payment', 400);
    }

    assertChapaConfigured();

    const uniqueTxRef = generateCarTxRef(carId);
    console.log(`[Payment Init] Generated NEW txRef for car ${carId}: ${uniqueTxRef}`);

    car.pendingPaymentTxRef = uniqueTxRef;
    await car.save();

    return {
        txRef: uniqueTxRef,
        publicKey: CHAPA_PUBLIC_KEY,
    };
};

const initializePackagePayment = async ({ valetUser, amount, packageDuration, customerPhone, carData }) => {
    if (!valetUser || valetUser.type !== ROLES.VALET) {
        throw new AppError('Only parking officers can initialize package payments', 403);
    }

    const licensePlate = `${carData.plateCode}-${carData.region}-${carData.licensePlateNumber}`.toUpperCase();
    const flaggedCar = await ParkedCar.findOne({
        isFlagged: true,
        $or: [
            { licensePlate },
            {
                plateCode: carData.plateCode,
                region: carData.region,
                licensePlateNumber: carData.licensePlateNumber.toUpperCase(),
            },
            { phoneNumber: carData.phoneNumber.trim() },
        ],
    });

    if (flaggedCar) {
        throw await buildFlaggedCustomerError(flaggedCar);
    }

    assertChapaConfigured();

    const txRef = generatePackageTxRef();
    console.log(`[Package Payment Init] Generated NEW txRef: ${txRef}`);

    await PendingPackagePayment.create({
        txRef,
        carData,
        serviceType: 'package',
        packageDuration,
        amount,
        customerPhone,
        valetId: valetUser._id,
        parkZoneCode: valetUser.parkZoneCode || 'Unknown Zone',
    });

    return { txRef, publicKey: CHAPA_PUBLIC_KEY };
};

const verifyParkingPayment = async (txRef, queryCarId) => {
    const chapaResult = await verifyTransaction(txRef);

    if (!chapaResult.ok) {
        if (isPendingVerificationError(chapaResult.statusCode, chapaResult.message)) {
            return {
                httpStatus: 200,
                body: {
                    success: true,
                    transaction: { status: 'pending', txRef },
                    message: 'Payment is still processing. Please wait and try again.',
                },
            };
        }
        return {
            httpStatus: chapaResult.statusCode || 400,
            body: { error: chapaResult.message },
        };
    }

    console.log(`[Payment Verify] Chapa API response for ${txRef}:`, {
        apiStatus: chapaResult.data?.status,
        transactionStatus: chapaResult.data?.data?.status,
    });

    if (chapaResult.data.status !== 'success' || !chapaResult.data.data) {
        return {
            httpStatus: 200,
            body: {
                success: true,
                transaction: { status: 'pending', txRef },
                message: 'Payment verification pending. Please wait and try again.',
            },
        };
    }

    const transaction = chapaResult.data.data;
    const normalizedStatus = normalizeChapaStatus(transaction.status);

    console.log(`[Payment Verify] Transaction status - Original: ${transaction.status}, Normalized: ${normalizedStatus}`);

    if (['pending', 'processing', 'initiated'].includes(normalizedStatus)) {
        return {
            httpStatus: 200,
            body: {
                success: true,
                transaction: { status: normalizedStatus, txRef: transaction.tx_ref || txRef },
                message: 'Payment is still processing. Please wait and try again.',
            },
        };
    }

    if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
        return {
            httpStatus: 200,
            body: {
                success: false,
                transaction: { status: normalizedStatus, txRef: transaction.tx_ref || txRef },
                message: `Payment ${normalizedStatus}. Please try again.`,
            },
        };
    }

    const carId = await resolveCarIdFromTransaction(transaction, queryCarId);
    console.log(`[Payment Verify] Extracted carId: ${carId}, isValid: ${carId ? Types.ObjectId.isValid(carId) : false}`);

    if (!carId || !Types.ObjectId.isValid(carId)) {
        return {
            httpStatus: 200,
            body: {
                success: true,
                transaction: { status: normalizedStatus, txRef: transaction.tx_ref },
                message: 'Payment verified but car ID not found in transaction reference',
            },
        };
    }

    const car = await ParkedCar.findById(carId);
    console.log(`[Payment Verify] Car found: ${car ? 'YES' : 'NO'}, Car status: ${car?.status}`);

    if (car?.pendingPaymentTxRef && car.pendingPaymentTxRef !== txRef) {
        console.warn(`[Payment Verify] txRef mismatch for car ${carId}. Expected ${car.pendingPaymentTxRef}, got ${txRef} (continuing after Chapa verify)`);
    }

    if (car && normalizedStatus === 'successful') {
        await applySuccessfulOnlinePayment(car, txRef, transaction.amount);
        return {
            httpStatus: 200,
            body: {
                success: true,
                transaction: {
                    status: normalizedStatus,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    txRef: transaction.tx_ref,
                },
                car: {
                    id: car._id,
                    licensePlate: car.licensePlate,
                    status: car.status,
                },
                message: 'Payment verified and car checked out successfully',
            },
        };
    }

    return {
        httpStatus: 200,
        body: {
            success: true,
            transaction: { status: normalizedStatus, txRef: transaction.tx_ref },
            message: normalizedStatus === 'successful'
                ? 'Payment verified but car not found or already checked out'
                : 'Payment not successful',
        },
    };
};

const verifyPackagePayment = async (txRef) => {
    const chapaResult = await verifyTransaction(txRef);

    if (!chapaResult.ok) {
        if (isPendingVerificationError(chapaResult.statusCode, chapaResult.message)) {
            return {
                httpStatus: 200,
                body: {
                    success: true,
                    transaction: { status: 'pending', txRef },
                    message: 'Payment is still processing. Please wait and try again.',
                },
            };
        }
        return {
            httpStatus: chapaResult.statusCode || 400,
            body: { error: chapaResult.message },
        };
    }

    if (chapaResult.data.status !== 'success' || !chapaResult.data.data) {
        return { httpStatus: 400, body: { error: 'Payment verification failed' } };
    }

    const transaction = chapaResult.data.data;
    const normalizedStatus = normalizeChapaStatus(transaction.status);

    console.log(`[Package Payment Verify] Transaction status - Original: ${transaction.status}, Normalized: ${normalizedStatus}`);

    if (['pending', 'processing', 'initiated'].includes(normalizedStatus)) {
        return {
            httpStatus: 200,
            body: {
                success: true,
                transaction: { status: normalizedStatus, txRef: transaction.tx_ref || txRef },
                message: 'Payment is still processing. Please wait and try again.',
            },
        };
    }

    if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
        return {
            httpStatus: 200,
            body: {
                success: false,
                transaction: { status: normalizedStatus, txRef: transaction.tx_ref || txRef },
                message: `Payment ${normalizedStatus}. Please try again.`,
            },
        };
    }

    if (normalizedStatus === 'successful') {
        const { parkedCar, missingPending } = await createPackageCarFromPending({
            txRef,
            amountOverride: transaction.amount,
        });

        if (!parkedCar && missingPending) {
            return {
                httpStatus: 404,
                body: { error: 'Pending package payment not found or already processed' },
            };
        }

        return {
            httpStatus: 200,
            body: {
                success: true,
                transaction: {
                    status: normalizedStatus,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    txRef: transaction.tx_ref,
                },
                car: {
                    id: parkedCar._id,
                    licensePlate: parkedCar.licensePlate,
                    status: parkedCar.status,
                    serviceType: parkedCar.serviceType,
                    packageDuration: parkedCar.packageDuration,
                    packageStartDate: parkedCar.packageStartDate,
                    packageEndDate: parkedCar.packageEndDate,
                    phoneNumber: parkedCar.phoneNumber,
                },
                message: 'Payment verified and package registration processed successfully',
            },
        };
    }

    return {
        httpStatus: 202,
        body: {
            success: true,
            transaction: {
                status: normalizedStatus,
                amount: transaction.amount,
                currency: transaction.currency,
                txRef: transaction.tx_ref,
            },
            message: 'Payment not successful yet',
        },
    };
};

const parseCallbackPayload = (body) => {
    if (body.data) {
        return {
            tx_ref: body.data.tx_ref || body.data.txRef,
            status: body.data.status,
            amount: body.data.amount,
            meta: body.data.meta,
        };
    }
    return {
        tx_ref: body.tx_ref || body.txRef,
        status: body.status,
        amount: body.amount,
        meta: body.meta,
    };
};

const resolveVerifiedCallbackPayment = async (tx_ref, carIdHint, amountHint) => {
    let carId = carIdHint || null;
    let txRef = tx_ref;
    let verifiedAmount = amountHint;
    let paymentVerified = false;

    const chapaResult = await verifyTransaction(tx_ref);

    if (chapaResult.ok && chapaResult.data.status === 'success' && chapaResult.data.data) {
        const transaction = chapaResult.data.data;
        const txStatus = normalizeChapaStatus(transaction.status);

        if (txStatus === 'successful') {
            paymentVerified = true;
            verifiedAmount = verifiedAmount || transaction.amount;
            carId = carId || transaction.meta?.carId || null;
            if (transaction.tx_ref) {
                txRef = transaction.tx_ref;
            }
        } else {
            console.log(`[Chapa Callback] Payment verify status: ${txStatus}`);
        }
    } else if (!chapaResult.ok) {
        console.error('Error verifying payment in callback:', chapaResult.message);
    }

    return { carId, txRef, verifiedAmount, paymentVerified };
};

const processSuccessfulCarPayment = async (carId, txRef, amount) => {
    if (!carId || !Types.ObjectId.isValid(carId)) {
        return false;
    }

    const car = await ParkedCar.findById(carId);
    if (canProcessCarPayment(car)) {
        await applySuccessfulOnlinePayment(car, txRef, amount);
        console.log(`Car ${carId} checked out successfully via Chapa callback`);
        return true;
    }

    if (!car) {
        console.warn(`[Chapa Callback] Car not found for id ${carId}`);
    }
    return false;
};

const processSuccessfulPackagePayment = async (txRef, amount) => {
    try {
        const { parkedCar, wasExisting, missingPending } = await createPackageCarFromPending({
            txRef,
            amountOverride: amount,
        });
        if (parkedCar) {
            console.log(`Package payment processed via callback, car id ${parkedCar._id}${wasExisting ? ' (existing)' : ''}`);
            return true;
        }
        if (missingPending) {
            console.log(`Pending package payment not found for txRef: ${txRef}`);
        }
    } catch (err) {
        console.error('Failed to create car from package payment callback:', err);
    }
    return false;
};

const handleCallbackPost = async (body, query) => {
    console.log('Chapa callback full body:', JSON.stringify(body, null, 2));

    const { tx_ref, status, amount, meta } = parseCallbackPayload(body);
    console.log('Chapa callback extracted:', { tx_ref, status, amount, meta, carId: query.carId });

    const normalizedCallbackStatus = normalizeChapaStatus(status);

    if (normalizedCallbackStatus !== 'successful' || !tx_ref) {
        return { received: true, message: 'Callback processed' };
    }

    let carId = query.carId || meta?.carId || null;
    const { carId: resolvedCarId, txRef, verifiedAmount, paymentVerified } =
        await resolveVerifiedCallbackPayment(tx_ref, carId, amount);

    carId = resolvedCarId;

    if (!paymentVerified) {
        console.warn(`[Chapa Callback] Could not verify payment for tx_ref ${tx_ref}`);
    }

    if (!carId && paymentVerified) {
        const pendingCar = await ParkedCar.findOne({
            pendingPaymentTxRef: { $ne: null },
            $or: [
                { status: 'parked' },
                { status: 'checked_out', isFlagged: true },
            ],
        }).sort({ updatedAt: -1 });

        if (pendingCar) {
            carId = pendingCar._id.toString();
            console.log(`[Chapa Callback] Resolved car ${carId} from pendingPaymentTxRef`);
        }
    }

    if (carId && paymentVerified) {
        const processed = await processSuccessfulCarPayment(carId, txRef || tx_ref, verifiedAmount);
        if (!processed && paymentVerified) {
            console.warn(`[Chapa Callback] Skipping car ${carId} — payment not verified or car not eligible`);
        }
    } else if (txRef || tx_ref) {
        await processSuccessfulPackagePayment(tx_ref, verifiedAmount || amount);
    }

    return { received: true, message: 'Callback processed' };
};

const handleCallbackGet = async (query) => {
    const { tx_ref, status } = query;
    const normalizedCallbackStatus = normalizeChapaStatus(status);

    if (normalizedCallbackStatus !== 'successful' || !tx_ref) {
        return { received: true, message: 'Callback processed' };
    }

    const chapaResult = await verifyTransaction(tx_ref);

    if (!chapaResult.ok || chapaResult.data.status !== 'success' || !chapaResult.data.data) {
        if (!chapaResult.ok) {
            console.error('Error verifying payment in callback (GET):', chapaResult.message);
        }
        return { received: true, message: 'Callback processed' };
    }

    const transaction = chapaResult.data.data;
    const txStatus = normalizeChapaStatus(transaction.status);
    const carId = query.carId || transaction.meta?.carId;

    if (carId && Types.ObjectId.isValid(carId) && txStatus === 'successful') {
        await processSuccessfulCarPayment(carId, tx_ref, transaction.amount);
    } else if (transaction.tx_ref && txStatus === 'successful') {
        await processSuccessfulPackagePayment(transaction.tx_ref, transaction.amount);
    }

    return { received: true, message: 'Callback processed' };
};

const handleWebhook = async (body) => {
    const { tx_ref, status } = body;
    const normalizedWebhookStatus = normalizeChapaStatus(status);

    if (normalizedWebhookStatus !== 'successful' || !tx_ref) {
        return { received: true };
    }

    const carIdMatch = tx_ref.match(/tana-([a-f0-9]{10,24})/);
    const carId = carIdMatch ? carIdMatch[1] : null;

    if (carId && Types.ObjectId.isValid(carId)) {
        const car = await ParkedCar.findById(carId);
        if (canProcessCarPayment(car)) {
            await applySuccessfulOnlinePayment(car, tx_ref, null);
        }
    }

    return { received: true };
};

module.exports = {
    normalizeChapaStatus,
    canProcessCarPayment,
    applySuccessfulOnlinePayment,
    createPackageCarFromPending,
    initializeParkingPayment,
    initializePackagePayment,
    verifyParkingPayment,
    verifyPackagePayment,
    handleCallbackPost,
    handleCallbackGet,
    handleWebhook,
};
