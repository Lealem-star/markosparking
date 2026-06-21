import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
    fetchFlaggedCars,
    notifyFlaggedCustomer,
    initializeChapaPayment,
    CHAPA_BACKEND_CALLBACK_URL,
    updateParkedCar,
    verifyChapaPayment,
} from '../../api/api';
import { queuePaymentSuccess } from '../../utils/paymentSuccessQueue';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
    FlaggedStatCards,
    FlaggedFilterBar,
    FlaggedZoneAccordion,
    FlaggedPaymentModal,
    calculateFlaggedFee,
    filterFlaggedCars,
    getFlaggedStats,
    getUniqueZones,
    groupFlaggedByZone,
    exportFlaggedCsv,
} from './flaggedModules';
import '../../css/flaggedCustomers.scss';
import '../../css/parkedCarsList.scss';

const FlaggedCustomers = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const user = useSelector((state) => state.user);
    const [flaggedCars, setFlaggedCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCar, setSelectedCar] = useState(null);
    const [feeDetails, setFeeDetails] = useState(null);
    const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
    const [banner, setBanner] = useState(null);
    const chapaInstanceRef = useRef(null);

    const unknownZone = t('admin.unknownZone');

    const showBanner = useCallback((message, type = 'error') => {
        setBanner({ message, type });
        setTimeout(() => setBanner(null), 6000);
    }, []);

    const dismissBanner = useCallback(() => setBanner(null), []);

    const loadFlaggedCars = useCallback(() => {
        if (!user?.token) return;
        setLoading(true);
        fetchFlaggedCars({
            token: user.token,
            setFlaggedCars: (cars) => {
                setFlaggedCars(cars || []);
                setLoading(false);
            },
            handleError: () => {
                setLoading(false);
            },
        });
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) {
            loadFlaggedCars();
        }
    }, [user?.token, loadFlaggedCars]);

    const filteredCars = useMemo(
        () => filterFlaggedCars(flaggedCars, { searchQuery, zoneFilter, statusFilter }, unknownZone),
        [flaggedCars, searchQuery, zoneFilter, statusFilter, unknownZone]
    );

    const stats = useMemo(
        () => getFlaggedStats(flaggedCars, unknownZone),
        [flaggedCars, unknownZone]
    );

    const zones = useMemo(() => getUniqueZones(flaggedCars, unknownZone), [flaggedCars, unknownZone]);

    const zoneGroups = useMemo(
        () => groupFlaggedByZone(filteredCars, unknownZone),
        [filteredCars, unknownZone]
    );

    const handlePayNow = async (car) => {
        const fee = calculateFlaggedFee(car);
        setSelectedCar(car);
        setFeeDetails(fee);
        setTimeout(() => {
            handlePaymentMethod('online', car, fee);
        }, 100);
    };

    const handlePaymentMethod = async (paymentMethod, car = selectedCar, fee = feeDetails) => {
        const carToUse = car || selectedCar;
        const feeToUse = fee || feeDetails;

        if (!carToUse || !feeToUse) return;

        setLoading(true);

        try {
            if (chapaInstanceRef.current) {
                const container = document.getElementById('chapa-inline-form');
                if (container) container.innerHTML = '';
                chapaInstanceRef.current = null;
            }
            localStorage.removeItem(`chapa_payment_${carToUse._id}`);

            const customerName = carToUse.customerName || 'Customer';
            const customerEmail = carToUse.customerEmail || `${carToUse.phoneNumber?.replace(/[^0-9]/g, '') || 'customer'}@tana-parking.com`;
            const customerPhone = carToUse.phoneNumber;

            if (!customerPhone) {
                showBanner('Customer phone number is required for payment', 'error');
                setLoading(false);
                return;
            }

            await initializeChapaPayment({
                carId: carToUse._id,
                amount: feeToUse.totalWithVat,
                customerName,
                customerEmail,
                customerPhone,
                token: user?.token,
                handleInitSuccess: async (data) => {
                    localStorage.setItem(`chapa_payment_${carToUse._id}`, JSON.stringify({
                        txRef: data.txRef,
                        carId: carToUse._id,
                        feeDetails: feeToUse,
                        customerPhone,
                        isFlagged: true,
                        initiatedAt: Date.now(),
                    }));

                    const chapaPublicKey = data.publicKey || process.env.REACT_APP_CHAPA_PUBLIC_KEY;

                    if (!chapaPublicKey || !data.txRef) {
                        showBanner('Payment service is temporarily unavailable. Please try again.', 'error');
                        setLoading(false);
                        return;
                    }

                    const isValidTestKey = chapaPublicKey.startsWith('CHAPUBK_TEST-');
                    const isValidLiveKey = chapaPublicKey.startsWith('CHAPUBK-');
                    if (!isValidTestKey && !isValidLiveKey) {
                        showBanner('Payment service is temporarily unavailable. Please try again.', 'error');
                        setLoading(false);
                        return;
                    }

                    try {
                        let ChapaCheckout;
                        if (window.ChapaCheckout) {
                            ChapaCheckout = window.ChapaCheckout;
                        } else {
                            await new Promise((resolve, reject) => {
                                let attempts = 0;
                                const checkInterval = setInterval(() => {
                                    attempts++;
                                    if (window.ChapaCheckout) {
                                        clearInterval(checkInterval);
                                        ChapaCheckout = window.ChapaCheckout;
                                        resolve();
                                    } else if (attempts > 30) {
                                        clearInterval(checkInterval);
                                        reject(new Error('Chapa library failed to load'));
                                    }
                                }, 100);
                            });
                        }

                        if (!ChapaCheckout || typeof ChapaCheckout !== 'function') {
                            showBanner('Chapa payment library is not loaded. Please refresh the page.', 'error');
                            setLoading(false);
                            return;
                        }

                        const formattedAmount = parseFloat(feeToUse.totalWithVat).toFixed(2);
                        const isTestMode = chapaPublicKey.startsWith('CHAPUBK_TEST-');
                        let formattedPhone = customerPhone;

                        if (isTestMode) {
                            if (formattedPhone.startsWith('+251')) {
                                formattedPhone = '0' + formattedPhone.substring(4);
                            } else if (!formattedPhone.startsWith('0')) {
                                formattedPhone = '0' + formattedPhone;
                            }
                        } else if (formattedPhone && !formattedPhone.startsWith('+')) {
                            formattedPhone = formattedPhone.replace(/^0/, '+251');
                            if (!formattedPhone.startsWith('+')) {
                                formattedPhone = `+251${formattedPhone}`;
                            }
                        }

                        const chapaConfig = {
                            publicKey: chapaPublicKey,
                            txRef: data.txRef,
                            tx_ref: data.txRef,
                            amount: formattedAmount,
                            currency: 'ETB',
                            phoneNumber: formattedPhone,
                            firstName: 'Customer',
                            lastName: 'User',
                            email: customerEmail,
                            availablePaymentMethods: ['telebirr', 'cbebirr', 'ebirr', 'mpesa'],
                            customizations: {
                                title: 'Tana Parking Payment',
                                description: `Unpaid parking fee payment for ${carToUse.licensePlate || 'your vehicle'}`,
                                buttonText: 'Pay Now',
                            },
                            callbackUrl: `${CHAPA_BACKEND_CALLBACK_URL}?carId=${carToUse._id}`,
                            callback_url: `${CHAPA_BACKEND_CALLBACK_URL}?carId=${carToUse._id}`,
                            returnUrl: `${window.location.origin}${location.pathname}`,
                            return_url: `${window.location.origin}${location.pathname}`,
                            showFlag: true,
                            showPaymentMethodsNames: true,
                            onSuccessfulPayment: async (response) => {
                                const chapaTxRef = response?.tx_ref || response?.txRef || data.txRef;

                                const finishFlaggedPayment = () => {
                                    localStorage.removeItem(`chapa_payment_${carToUse._id}`);
                                    loadFlaggedCars();
                                    setShowPaymentFormModal(false);
                                    setSelectedCar(null);
                                    setFeeDetails(null);
                                    setLoading(false);
                                    queuePaymentSuccess({
                                        message: t('valet.paymentSuccessful'),
                                        amount: feeToUse.totalWithVat,
                                    });
                                };

                                const fallbackUpdate = () => updateParkedCar({
                                    id: carToUse._id,
                                    body: {
                                        status: 'checked_out',
                                        paymentMethod: 'online',
                                        totalPaidAmount: feeToUse.totalWithVat,
                                        baseAmount: feeToUse.parkingFee,
                                        vatAmount: feeToUse.vatAmount,
                                        isFlagged: false,
                                        flaggedAt: null,
                                        flaggedBy: null,
                                        notificationSent: false,
                                        lastNotificationSentAt: null,
                                    },
                                    token: user?.token,
                                    handleUpdateParkedCarSuccess: finishFlaggedPayment,
                                    handleUpdateParkedCarFailure: () => {
                                        showBanner(`${t('messages.error')}: ${t('messages.operationFailed')}`, 'error');
                                        setLoading(false);
                                    },
                                });

                                if (chapaTxRef) {
                                    await verifyChapaPayment({
                                        txRef: chapaTxRef,
                                        carId: carToUse._id,
                                        token: user?.token,
                                        handleVerifySuccess: finishFlaggedPayment,
                                        handleVerifyFailure: () => fallbackUpdate(),
                                    });
                                } else {
                                    await fallbackUpdate();
                                }
                            },
                            onPaymentFailure: () => {
                                showBanner(`${t('messages.error')}: ${t('valet.paymentFailed')}`, 'error');
                                setLoading(false);
                            },
                            onClose: () => {
                                setShowPaymentFormModal(false);
                                setLoading(false);
                            },
                        };

                        const chapa = new ChapaCheckout(chapaConfig);
                        chapaInstanceRef.current = chapa;
                        setShowPaymentFormModal(true);

                        setTimeout(() => {
                            const container = document.getElementById('chapa-inline-form');
                            if (container) {
                                try {
                                    chapa.initialize('chapa-inline-form');
                                    setLoading(false);
                                } catch (initError) {
                                    showBanner(`Failed to initialize payment form: ${initError?.message || 'Unknown error'}`, 'error');
                                    setShowPaymentFormModal(false);
                                    setLoading(false);
                                }
                            } else {
                                showBanner('Failed to load payment form. Please try again.', 'error');
                                setShowPaymentFormModal(false);
                                setLoading(false);
                            }
                        }, 100);
                    } catch (initError) {
                        showBanner(`Failed to initialize payment: ${initError?.message || 'Unknown error'}`, 'error');
                        setShowPaymentFormModal(false);
                        setLoading(false);
                    }
                },
                handleInitFailure: (error) => {
                    showBanner(`Failed to initialize payment: ${error}`, 'error');
                    setLoading(false);
                },
            });
        } catch (error) {
            showBanner(`Failed to initialize payment: ${error?.message || 'Please try again.'}`, 'error');
            setLoading(false);
        }
    };

    const handleClosePaymentFormModal = () => {
        if (chapaInstanceRef.current) {
            const container = document.getElementById('chapa-inline-form');
            if (container) container.innerHTML = '';
            chapaInstanceRef.current = null;
        }
        setShowPaymentFormModal(false);
        setLoading(false);
    };

    const handleNotify = async (car) => {
        if (!car._id) return;

        setLoading(true);
        try {
            await notifyFlaggedCustomer({
                id: car._id,
                token: user?.token,
                handleNotifySuccess: () => {
                    showBanner(t('valet.notificationSent'), 'success');
                    loadFlaggedCars();
                    setLoading(false);
                },
                handleNotifyFailure: (error) => {
                    showBanner(`Failed to send notification: ${error}`, 'error');
                    setLoading(false);
                },
            });
        } catch {
            showBanner('Failed to send notification. Please try again.', 'error');
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (filteredCars.length === 0) return;
        exportFlaggedCsv(filteredCars, t);
    };

    return (
        <div className="flagged-customers">
            {banner && (
                <div className={`alert-banner alert-banner-${banner.type}`} role="alert">
                    <span className="alert-banner-message">{banner.message}</span>
                    <button type="button" className="alert-banner-dismiss" onClick={dismissBanner} aria-label="Dismiss">
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="flagged-page-header">
                <div>
                    <h1>{t('valet.flaggedCustomers')}</h1>
                    <p>{t('valet.flaggedCustomersSubtitle')}</p>
                </div>
                <button
                    type="button"
                    className="flagged-btn flagged-btn--refresh"
                    onClick={loadFlaggedCars}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    {t('common.refresh')}
                </button>
            </div>

            <FlaggedStatCards stats={stats} t={t} />

            <FlaggedFilterBar
                t={t}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                zoneFilter={zoneFilter}
                onZoneChange={setZoneFilter}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                zones={zones}
                onExport={handleExport}
                loading={loading}
            />

            {loading && flaggedCars.length === 0 ? (
                <div className="flagged-loading">{t('common.loading')}</div>
            ) : filteredCars.length === 0 ? (
                <div className="flagged-empty-message">
                    <AlertTriangle size={40} style={{ color: '#94a3b8', marginBottom: 12 }} />
                    <p>{t('valet.noFlaggedCars')}</p>
                </div>
            ) : (
                <FlaggedZoneAccordion
                    groups={zoneGroups}
                    t={t}
                    loading={loading}
                    onPayNow={handlePayNow}
                    onNotify={handleNotify}
                />
            )}

            <FlaggedPaymentModal
                t={t}
                isOpen={showPaymentFormModal}
                selectedCar={selectedCar}
                feeDetails={feeDetails}
                loading={loading}
                onClose={handleClosePaymentFormModal}
            />
        </div>
    );
};

export default FlaggedCustomers;
