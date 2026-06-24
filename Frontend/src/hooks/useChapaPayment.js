import { useCallback } from 'react';
import {
    initChapaPayment,
    initPackagePayment,
    verifyChapaPaymentTx,
    verifyChapaPackagePaymentTx,
    sendSms,
    updateParkedCarRecord,
    CHAPA_BACKEND_CALLBACK_URL,
} from '../api/api';
import { getApiError } from '../api/client';
import { useChapaInlineCheckout } from './useChapaInlineCheckout';
import {
    buildStandardChapaConfig,
    clearChapaStorageKey,
    validateChapaPublicKey,
} from '../utils/chapaInline';
import { queuePaymentSuccess } from '../utils/paymentSuccessQueue';
import { getLicensePlate } from '../utils/carDisplay';
import {
    buildCheckoutSmsMessage,
    buildPackageActivationSms,
    formatChapaPaymentFailureMessage,
    CHAPA_PAY_BUTTON_STYLES,
} from '../utils/chapaPaymentMessages';
import {
    PACKAGE_DURATIONS,
    calculatePackageFee,
} from '../pages/valet/registerCarModules/registerCarUtils';

const verifyPackageWithRetry = async (txRef, token, maxAttempts = 10, delayMs = 1200) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const result = await verifyChapaPackagePaymentTx(txRef, token);

            if (result?.transaction?.status === 'successful') {
                return result;
            }

            if (result?.transaction?.status === 'pending' || result?.transaction?.status === 'processing') {
                // eslint-disable-next-line no-await-in-loop
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }

            if (result?.transaction?.status === 'failed' || result?.transaction?.status === 'cancelled') {
                throw new Error(result?.message || 'Payment failed or was cancelled.');
            }

            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, delayMs));
        } catch (error) {
            const errMsg = (error?.message || '').toLowerCase();
            const isAlreadyProcessed = errMsg.includes('already processed')
                || errMsg.includes('not found')
                || error?.response?.status === 404;

            if (isAlreadyProcessed) {
                return { transaction: { status: 'successful' }, alreadyProcessed: true };
            }

            if (attempt < maxAttempts) {
                // eslint-disable-next-line no-await-in-loop
                await new Promise((r) => setTimeout(r, delayMs));
                continue;
            }

            throw error;
        }
    }

    throw new Error('Payment is still pending. Please wait a moment and try again.');
};

const reportError = (onError, message) => {
    if (onError) onError(message);
};

const reportSmsFailed = (onSmsFailed, t, smsError) => {
    if (!onSmsFailed) return;

    const detail = smsError?.response?.data?.error
        || smsError?.message
        || '';
    const baseMessage = t?.('messages.smsFailed') || 'SMS notification failed.';
    const message = detail && !baseMessage.includes(detail)
        ? `${baseMessage} ${detail}`
        : baseMessage;

    onSmsFailed(message);
};

export const useChapaPayment = ({
    mode,
    user,
    setLoading,
    setShowPaymentFormModal,
    onError,
    onSmsFailed,
    loading = false,
    returnUrl,
    t,
    formData,
    pricingSettings,
    onCarPaymentComplete,
    onFlaggedPaymentComplete,
    onPackagePaymentComplete,
    onPaymentInitialized,
    onPaymentClosed,
}) => {
    const { cleanup, openInlineCheckout } = useChapaInlineCheckout();

    const closePayment = useCallback((force = false) => {
        if (!force && loading) return;
        cleanup();
        setShowPaymentFormModal(false);
        if (onPaymentClosed) onPaymentClosed();
    }, [cleanup, loading, setShowPaymentFormModal, onPaymentClosed]);

    const openCheckout = useCallback(async (chapaConfig) => {
        setShowPaymentFormModal(true);
        await openInlineCheckout(chapaConfig);
        setLoading(false);
    }, [openInlineCheckout, setShowPaymentFormModal, setLoading]);

    const startCarFlow = useCallback(async ({ car, feeDetails, variant = 'checkout' }) => {
        if (!car || !feeDetails) return;

        const isFlagged = variant === 'flagged';
        const storageKey = `chapa_payment_${car._id}`;
        const customerPhone = car.phoneNumber;

        if (!customerPhone) {
            reportError(onError, 'Customer phone number is required for payment');
            setLoading(false);
            return;
        }

        cleanup();
        clearChapaStorageKey(storageKey);
        setLoading(true);

        const customerName = car.customerName || 'Customer';
        const customerEmail = car.customerEmail || `${car.phoneNumber?.replace(/[^0-9]/g, '') || 'customer'}@tana-parking.com`;
        const resolvedReturnUrl = returnUrl || `${window.location.origin}${window.location.pathname}`;

        try {
            const data = await initChapaPayment({
                carId: car._id,
                amount: feeDetails.totalWithVat,
                customerName,
                customerEmail,
                customerPhone,
            }, user?.token);

            localStorage.setItem(storageKey, JSON.stringify({
                txRef: data.txRef,
                carId: car._id,
                feeDetails,
                customerPhone: car.phoneNumber || customerPhone,
                isFlagged,
                initiatedAt: Date.now(),
            }));

            const chapaPublicKey = data.publicKey || process.env.REACT_APP_CHAPA_PUBLIC_KEY;
            const keyValidation = validateChapaPublicKey(chapaPublicKey);

            if (!keyValidation.valid || !data.txRef) {
                reportError(onError, 'Payment service is temporarily unavailable. Please try again.');
                setLoading(false);
                return;
            }

            const finishCheckout = async () => {
                if (!isFlagged) {
                    try {
                        await sendSms(car.phoneNumber, buildCheckoutSmsMessage(car, feeDetails), user?.token);
                    } catch (smsError) {
                        reportSmsFailed(onSmsFailed, t, smsError);
                    }
                }

                cleanup();
                clearChapaStorageKey(storageKey);
                setShowPaymentFormModal(false);
                setLoading(false);

                if (isFlagged) {
                    onFlaggedPaymentComplete?.(feeDetails);
                } else {
                    onCarPaymentComplete?.(feeDetails);
                }
            };

            const fallbackBody = isFlagged
                ? {
                    status: 'checked_out',
                    paymentMethod: 'online',
                    totalPaidAmount: feeDetails.totalWithVat,
                    baseAmount: feeDetails.parkingFee,
                    vatAmount: feeDetails.vatAmount,
                    isFlagged: false,
                    flaggedAt: null,
                    flaggedBy: null,
                    notificationSent: false,
                    lastNotificationSentAt: null,
                }
                : {
                    status: 'checked_out',
                    paymentMethod: 'online',
                    totalPaidAmount: feeDetails.totalWithVat,
                };

            const runFallbackUpdate = async () => {
                try {
                    await updateParkedCarRecord(car._id, fallbackBody, user?.token);
                    await finishCheckout();
                } catch (updateError) {
                    console.error('Failed to update car:', updateError);
                    const message = isFlagged
                        ? `${t?.('messages.error') || 'Error'}: ${t?.('messages.operationFailed') || 'Operation failed'}`
                        : 'Payment successful but failed to update car status. Please contact support.';
                    reportError(onError, message);
                    setLoading(false);
                }
            };

            const chapaConfig = buildStandardChapaConfig({
                publicKey: chapaPublicKey,
                txRef: data.txRef,
                amount: feeDetails.totalWithVat,
                phoneNumber: customerPhone,
                email: customerEmail,
                description: isFlagged
                    ? `Unpaid parking fee payment for ${getLicensePlate(car) || 'your vehicle'}`
                    : `Parking fee payment for ${getLicensePlate(car) || 'your vehicle'}`,
                callbackUrl: `${CHAPA_BACKEND_CALLBACK_URL}?carId=${car._id}`,
                returnUrl: resolvedReturnUrl,
                customizations: isFlagged ? {} : { styles: CHAPA_PAY_BUTTON_STYLES },
                callbacks: {
                    onSuccessfulPayment: async (response) => {
                        const chapaTxRef = response?.tx_ref || response?.txRef || data.txRef;
                        try {
                            if (chapaTxRef) {
                                await verifyChapaPaymentTx(chapaTxRef, user?.token, car._id);
                            }
                            await finishCheckout();
                        } catch {
                            await runFallbackUpdate();
                        }
                    },
                    onPaymentFailure: (paymentError) => {
                        clearChapaStorageKey(storageKey);
                        cleanup();
                        const message = isFlagged
                            ? `${t?.('messages.error') || 'Error'}: ${t?.('valet.paymentFailed') || 'Payment failed'}`
                            : `Payment failed: ${formatChapaPaymentFailureMessage(paymentError, car.phoneNumber)}`;
                        reportError(onError, message);
                        setLoading(false);
                    },
                    onClose: () => {
                        setShowPaymentFormModal(false);
                        setLoading(false);
                    },
                    onPaymentClose: () => {
                        setShowPaymentFormModal(false);
                        setLoading(false);
                    },
                },
            });

            await openCheckout(chapaConfig);
        } catch (error) {
            reportError(onError, getApiError(error, 'An error occurred. Please try again.'));
            setShowPaymentFormModal(false);
            setLoading(false);
        }
    }, [
        user?.token,
        onError,
        onSmsFailed,
        onCarPaymentComplete,
        onFlaggedPaymentComplete,
        setShowPaymentFormModal,
        setLoading,
        cleanup,
        openCheckout,
        returnUrl,
        t,
    ]);

    const startPackageFlow = useCallback(async (duration) => {
        if (!formData) return;

        setLoading(true);

        const validatedDuration = PACKAGE_DURATIONS.includes(duration) ? duration : null;
        if (!validatedDuration) {
            reportError(onError, 'Invalid package duration selected.');
            setLoading(false);
            return;
        }

        const feeInfo = calculatePackageFee(
            formData.carType,
            validatedDuration,
            pricingSettings,
            user?.priceLevel
        );

        if (!feeInfo?.totalWithVat || feeInfo.totalWithVat <= 0) {
            reportError(onError, 'Package pricing not configured or invalid. Please contact administrator.');
            setLoading(false);
            return;
        }

        if (!user?.priceLevel) {
            reportError(onError, 'Your account has no price level assigned. Please contact admin.');
            setLoading(false);
            return;
        }

        const carDataPayload = {
            plateCode: formData.plateCode,
            region: formData.region,
            licensePlateNumber: formData.licensePlateNumber,
            carType: formData.carType,
            model: formData.model,
            color: formData.color,
            phoneNumber: formData.phoneNumber,
            notes: formData.notes,
            priceLevel: user.priceLevel,
        };

        try {
            const data = await initPackagePayment({
                amount: feeInfo.totalWithVat,
                packageDuration: validatedDuration,
                customerPhone: formData.phoneNumber,
                carData: carDataPayload,
            }, user?.token);

            const txRef = data?.txRef;
            const chapaPublicKey = data?.publicKey || process.env.REACT_APP_CHAPA_PUBLIC_KEY;

            if (!txRef || !chapaPublicKey) {
                reportError(onError, 'Payment service is temporarily unavailable. Please try again.');
                setLoading(false);
                return;
            }

            localStorage.setItem(`chapa_payment_pkg_${txRef}`, JSON.stringify({
                txRef,
                packageDuration: validatedDuration,
                amount: feeInfo.totalWithVat,
                carData: carDataPayload,
                initiatedAt: Date.now(),
            }));

            onPaymentInitialized?.({ txRef, amount: feeInfo.totalWithVat });

            setTimeout(async () => {
                try {
                    const keyValidation = validateChapaPublicKey(chapaPublicKey);
                    if (!keyValidation.valid) {
                        reportError(onError, 'Payment service is temporarily unavailable. Please try again.');
                        setShowPaymentFormModal(false);
                        setLoading(false);
                        return;
                    }

                    const chapaConfig = buildStandardChapaConfig({
                        publicKey: chapaPublicKey,
                        txRef,
                        amount: feeInfo.totalWithVat,
                        phoneNumber: formData.phoneNumber,
                        description: `${validatedDuration} parking package`,
                        callbackUrl: CHAPA_BACKEND_CALLBACK_URL,
                        returnUrl: `${window.location.origin}/valet/register-car`,
                        customizations: { buttonText: 'Pay Now' },
                        callbacks: {
                            onSuccessfulPayment: async () => {
                                try {
                                    const verifyResult = await verifyPackageWithRetry(txRef, user?.token);

                                    try {
                                        await sendSms(
                                            formData.phoneNumber,
                                            buildPackageActivationSms(
                                                formData,
                                                verifyResult?.car,
                                                validatedDuration,
                                                feeInfo.totalWithVat
                                            ),
                                            user?.token
                                        );
                                    } catch (smsErr) {
                                        reportSmsFailed(onSmsFailed, t, smsErr);
                                    }

                                    localStorage.removeItem(`chapa_payment_pkg_${txRef}`);
                                    closePayment(true);
                                    setLoading(false);
                                    onPackagePaymentComplete?.(feeInfo.totalWithVat);
                                    queuePaymentSuccess({
                                        message: t('valet.packagePaymentSuccessful'),
                                        amount: feeInfo.totalWithVat,
                                        navigateTo: '/valet/dashboard',
                                    });
                                } catch (verifyErr) {
                                    reportError(
                                        onError,
                                        verifyErr?.message || 'Payment succeeded but verification is still pending. Please wait and refresh.'
                                    );
                                    setLoading(false);
                                }
                            },
                            onPaymentFailure: (err) => {
                                const errorMessage = err?.message
                                    || (typeof err === 'string' ? err : err?.error)
                                    || 'Please try again';
                                reportError(onError, `Payment failed: ${errorMessage}`);
                                setLoading(false);
                            },
                            onClose: () => {
                                closePayment();
                                setLoading(false);
                            },
                        },
                    });

                    chapaConfig.lastName = 'Package';
                    chapaConfig.last_name = 'Package';

                    await openCheckout(chapaConfig);
                } catch (inlineErr) {
                    console.error('Package inline payment init error:', inlineErr);
                    reportError(onError, 'Failed to load payment form. Please try again.');
                    setShowPaymentFormModal(false);
                    setLoading(false);
                }
            }, 100);
        } catch (err) {
            console.error('startPackageFlow error:', err);
            reportError(onError, getApiError(err, 'Failed to start package payment'));
            setLoading(false);
        }
    }, [
        user,
        formData,
        pricingSettings,
        t,
        onError,
        onSmsFailed,
        setLoading,
        setShowPaymentFormModal,
        onPackagePaymentComplete,
        onPaymentInitialized,
        closePayment,
        openCheckout,
    ]);

    const startPayment = useCallback(async (params) => {
        if (mode === 'package') {
            return startPackageFlow(params?.duration);
        }
        return startCarFlow(params);
    }, [mode, startCarFlow, startPackageFlow]);

    return { startPayment, closePayment };
};
