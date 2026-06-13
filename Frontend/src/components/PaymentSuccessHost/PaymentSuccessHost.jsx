import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PaymentSuccessModal from '../PaymentSuccessModal/PaymentSuccessModal';
import { verifyChapaPayment, verifyChapaPackagePayment } from '../../api/api';
import {
    consumePaymentSuccess,
    PAYMENT_SUCCESS_EVENT,
    queuePaymentSuccess,
    readPaymentSuccess,
} from '../../utils/paymentSuccessQueue';

const RECENT_PAYMENT_MS = 15 * 60 * 1000;

const PaymentSuccessHost = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const user = useSelector((state) => state.user);
    const [modal, setModal] = useState(null);

    const openFromStorage = useCallback(() => {
        const pending = readPaymentSuccess();
        if (pending) {
            setModal(pending);
        }
    }, []);

    const recoverRedirectedPayment = useCallback(async () => {
        if (!user?.token) return;

        const pending = readPaymentSuccess();
        if (pending) return;

        const now = Date.now();

        for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key) continue;

            if (key.startsWith('chapa_payment_pkg_')) {
                let stored;
                try {
                    stored = JSON.parse(localStorage.getItem(key));
                } catch {
                    continue;
                }

                if (!stored?.txRef || !stored?.initiatedAt || now - stored.initiatedAt > RECENT_PAYMENT_MS) {
                    continue;
                }

                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve) => {
                    verifyChapaPackagePayment({
                        txRef: stored.txRef,
                        token: user.token,
                        handleVerifySuccess: (result) => {
                            if (result?.transaction?.status === 'successful' || result?.success) {
                                localStorage.removeItem(key);
                                queuePaymentSuccess({
                                    message: t('valet.packagePaymentSuccessful'),
                                    amount: stored.amount,
                                    navigateTo: '/valet/dashboard',
                                });
                            }
                            resolve();
                        },
                        handleVerifyFailure: () => resolve(),
                    });
                });
                return;
            }

            if (key.startsWith('chapa_payment_')) {
                let stored;
                try {
                    stored = JSON.parse(localStorage.getItem(key));
                } catch {
                    continue;
                }

                if (!stored?.txRef || !stored?.initiatedAt || now - stored.initiatedAt > RECENT_PAYMENT_MS) {
                    continue;
                }

                // eslint-disable-next-line no-await-in-loop
                await new Promise((resolve) => {
                    verifyChapaPayment({
                        txRef: stored.txRef,
                        carId: stored.carId,
                        token: user.token,
                        handleVerifySuccess: (result) => {
                            if (result?.success || result?.transaction?.status === 'successful') {
                                localStorage.removeItem(key);
                                queuePaymentSuccess({
                                    message: t('valet.paymentSuccessful'),
                                    amount: stored.feeDetails?.totalWithVat ?? stored.amount,
                                });
                            }
                            resolve();
                        },
                        handleVerifyFailure: () => resolve(),
                    });
                });
                return;
            }
        }
    }, [t, user?.token]);

    useEffect(() => {
        openFromStorage();
        recoverRedirectedPayment().then(openFromStorage);

        const onQueued = () => openFromStorage();
        window.addEventListener(PAYMENT_SUCCESS_EVENT, onQueued);
        return () => window.removeEventListener(PAYMENT_SUCCESS_EVENT, onQueued);
    }, [location.pathname, openFromStorage, recoverRedirectedPayment]);

    const handleClose = () => {
        const pending = modal;
        setModal(null);
        consumePaymentSuccess();

        if (pending?.navigateTo && location.pathname !== pending.navigateTo) {
            navigate(pending.navigateTo);
        }
    };

    if (!modal) return null;

    return (
        <PaymentSuccessModal
            show
            message={modal.message}
            amount={modal.amount}
            onClose={handleClose}
        />
    );
};

export default PaymentSuccessHost;
