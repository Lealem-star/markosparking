import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { fetchFlaggedCars, notifyFlaggedCustomer, initializeChapaPayment, CHAPA_BACKEND_CALLBACK_URL, updateParkedCar, verifyChapaPayment } from '../../api/api';
import { PaymentSuccessModal } from '../../components';
import { AlertTriangle, Bell, CreditCard, X } from 'lucide-react';
import '../../css/parkedCarsList.scss';

const FlaggedCustomers = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const user = useSelector((state) => state.user);
    const [flaggedCars, setFlaggedCars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);
    const [feeDetails, setFeeDetails] = useState(null);
    const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
    const [banner, setBanner] = useState(null); // { message, type: 'error'|'success' }
    const chapaInstanceRef = useRef(null);
    const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
    const [paymentSuccessDetails, setPaymentSuccessDetails] = useState({ message: '', amount: null });
    const paymentSuccessOnCloseRef = useRef(null);

    const showBanner = useCallback((message, type = 'error') => {
        setBanner({ message, type });
        // Auto-dismiss after 6 seconds
        setTimeout(() => setBanner(null), 6000);
    }, []);

    const dismissBanner = useCallback(() => setBanner(null), []);

    const handlePaymentSuccessClose = useCallback(() => {
        setShowPaymentSuccessModal(false);
        const onDone = paymentSuccessOnCloseRef.current;
        paymentSuccessOnCloseRef.current = null;
        onDone?.();
    }, []);

    const showPaymentSuccess = useCallback((message, amount, onDone) => {
        paymentSuccessOnCloseRef.current = onDone;
        setPaymentSuccessDetails({ message, amount });
        setShowPaymentSuccessModal(true);
    }, []);

    const loadFlaggedCars = useCallback(() => {
        if (!user?.token) return;
        setLoading(true);
        fetchFlaggedCars({
            token: user.token,
            setFlaggedCars: (cars) => {
                console.log('Flagged cars loaded:', cars);
                setFlaggedCars(cars || []);
                setLoading(false);
            },
            handleError: (error) => {
                console.error('Failed to load flagged cars:', error);
                setLoading(false);
            }
        });
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) {
            loadFlaggedCars();
        }
    }, [user?.token, loadFlaggedCars]);

    const calculateFee = (car) => {
        // Calculate fee from stored amounts or from duration
        let parkingFee = car.baseAmount || 0;
        let vatAmount = car.vatAmount || 0;
        let totalWithVat = parkingFee + vatAmount;

        // If fee not stored, calculate from duration
        if (totalWithVat === 0 && car.parkedAt && car.checkedOutAt) {
            const parkedAt = new Date(car.parkedAt);
            const checkedOutAt = new Date(car.checkedOutAt);
            const diffMs = checkedOutAt - parkedAt;
            const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)));
            const hoursParked = totalMinutes / 60;
            
            // Use default pricing (50 ETB/hour) - could be improved to use actual pricing
            parkingFee = Math.round((hoursParked * 50) * 100) / 100;
            vatAmount = Math.round(parkingFee * 0.15 * 100) / 100;
            totalWithVat = Math.round((parkingFee + vatAmount) * 100) / 100;
        }

        return {
            parkingFee,
            vatAmount,
            totalWithVat,
            parkedAt: car.parkedAt ? new Date(car.parkedAt).toLocaleString() : 'N/A',
            checkedOutAt: car.checkedOutAt ? new Date(car.checkedOutAt).toLocaleString() : 'N/A'
        };
    };

    const handlePayNow = async (car) => {
        const fee = calculateFee(car);
        setSelectedCar(car);
        setFeeDetails(fee);
        
        // Wait a moment for state to update, then initialize payment
        setTimeout(() => {
            handlePaymentMethod('online', car, fee);
        }, 100);
    };

    const handlePaymentMethod = async (paymentMethod, car = selectedCar, fee = feeDetails) => {
        const carToUse = car || selectedCar;
        const feeToUse = fee || feeDetails;
        
        if (!carToUse || !feeToUse) {
            console.error('Missing car or fee details');
            return;
        }

        setLoading(true);
        
        try {
            // Clean up any existing payment data and Chapa instances
            if (chapaInstanceRef.current) {
                const container = document.getElementById('chapa-inline-form');
                if (container) {
                    container.innerHTML = '';
                }
                chapaInstanceRef.current = null;
            }
            localStorage.removeItem(`chapa_payment_${carToUse._id}`);
            
            // Initialize Chapa payment
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
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                token: user?.token,
                handleInitSuccess: async (data) => {
                    // Store payment reference
                    localStorage.setItem(`chapa_payment_${carToUse._id}`, JSON.stringify({
                        txRef: data.txRef,
                        carId: carToUse._id,
                        feeDetails: feeToUse,
                        customerPhone: customerPhone,
                        isFlagged: true
                    }));

                    const chapaPublicKey = data.publicKey || process.env.REACT_APP_CHAPA_PUBLIC_KEY;
                    
                    if (!chapaPublicKey || !data.txRef) {
                        console.error('Chapa public key or txRef is missing');
                        showBanner('Payment service is temporarily unavailable. Please try again.', 'error');
                        setLoading(false);
                        return;
                    }

                    // Validate public key format
                    const isValidTestKey = chapaPublicKey.startsWith('CHAPUBK_TEST-');
                    const isValidLiveKey = chapaPublicKey.startsWith('CHAPUBK-');
                    if (!isValidTestKey && !isValidLiveKey) {
                        console.error('Invalid Chapa public key format. Expected CHAPUBK_TEST-* or CHAPUBK-*');
                        showBanner('Payment service is temporarily unavailable. Please try again.', 'error');
                        setLoading(false);
                        return;
                    }

                    // Initialize Chapa Inline.js
                    try {
                        // Get ChapaCheckout from window
                        let ChapaCheckout;
                        if (window.ChapaCheckout) {
                            ChapaCheckout = window.ChapaCheckout;
                        } else {
                            // Wait for script to load (max 3 seconds)
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

                        // Format amount and phone number
                        const formattedAmount = parseFloat(feeToUse.totalWithVat).toFixed(2);
                        const isTestMode = chapaPublicKey.startsWith('CHAPUBK_TEST-');
                        let formattedPhone = customerPhone;
                        
                        if (isTestMode) {
                            if (formattedPhone.startsWith('+251')) {
                                formattedPhone = '0' + formattedPhone.substring(4);
                            } else if (!formattedPhone.startsWith('0')) {
                                formattedPhone = '0' + formattedPhone;
                            }
                        } else {
                            if (formattedPhone && !formattedPhone.startsWith('+')) {
                                formattedPhone = formattedPhone.replace(/^0/, '+251');
                                if (!formattedPhone.startsWith('+')) {
                                    formattedPhone = `+251${formattedPhone}`;
                                }
                            }
                        }

                        // Chapa Inline.js configuration
                        const chapaConfig = {
                            publicKey: chapaPublicKey,
                            // Provide both txRef and tx_ref so Inline.js uses the exact reference
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
                                console.log('✅ Payment successful for flagged car', response);
                                const chapaTxRef = response?.tx_ref || response?.txRef || data.txRef;

                                const finishFlaggedPayment = () => {
                                    localStorage.removeItem(`chapa_payment_${carToUse._id}`);
                                    loadFlaggedCars();
                                    setShowPaymentFormModal(false);
                                    showPaymentSuccess(
                                        t('valet.paymentSuccessful'),
                                        feeToUse.totalWithVat,
                                        () => {
                                            setSelectedCar(null);
                                            setFeeDetails(null);
                                            setLoading(false);
                                        }
                                    );
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
                                        lastNotificationSentAt: null
                                    },
                                    token: user?.token,
                                    handleUpdateParkedCarSuccess: finishFlaggedPayment,
                                    handleUpdateParkedCarFailure: (err) => {
                                        console.error('Failed to update flagged car:', err);
                                        showBanner(`${t('messages.error')}: ${t('messages.operationFailed')}`, 'error');
                                        setLoading(false);
                                    }
                                });

                                if (chapaTxRef) {
                                    await verifyChapaPayment({
                                        txRef: chapaTxRef,
                                        carId: carToUse._id,
                                        token: user?.token,
                                        handleVerifySuccess: finishFlaggedPayment,
                                        handleVerifyFailure: () => fallbackUpdate()
                                    });
                                } else {
                                    await fallbackUpdate();
                                }
                            },
                            onPaymentFailure: (error) => {
                                console.error('❌ Payment failed:', error);
                                showBanner(`${t('messages.error')}: ${t('valet.paymentFailed')}`, 'error');
                                setLoading(false);
                            },
                            onClose: () => {
                                setShowPaymentFormModal(false);
                                setLoading(false);
                            }
                        };

                        const chapa = new ChapaCheckout(chapaConfig);
                        chapaInstanceRef.current = chapa;
                        
                        // Open payment form modal
                        setShowPaymentFormModal(true);
                        
                        // Wait for DOM to update, then initialize Chapa
                        setTimeout(() => {
                            const container = document.getElementById('chapa-inline-form');
                            if (container) {
                                try {
                                    chapa.initialize('chapa-inline-form');
                                    setLoading(false);
                                } catch (initError) {
                                    console.error('Error during chapa.initialize():', initError);
                                    showBanner(`Failed to initialize payment form: ${initError?.message || 'Unknown error'}`, 'error');
                                    setShowPaymentFormModal(false);
                                    setLoading(false);
                                }
                            } else {
                                console.error('Chapa container not found after rendering');
                                showBanner('Failed to load payment form. Please try again.', 'error');
                                setShowPaymentFormModal(false);
                                setLoading(false);
                            }
                        }, 100);
                    } catch (initError) {
                        console.error('ChapaCheckout constructor error:', initError);
                        showBanner(`Failed to initialize payment: ${initError?.message || 'Unknown error'}`, 'error');
                        setShowPaymentFormModal(false);
                        setLoading(false);
                    }
                },
                handleInitFailure: (error) => {
                    console.error('Payment initialization failed:', error);
                    showBanner(`Failed to initialize payment: ${error}`, 'error');
                    setLoading(false);
                }
            });
        } catch (error) {
            console.error('Payment initialization error:', error);
            showBanner(`Failed to initialize payment: ${error?.message || 'Please try again.'}`, 'error');
            setLoading(false);
        }
    };

    const handleClosePaymentFormModal = () => {
        if (chapaInstanceRef.current) {
            const container = document.getElementById('chapa-inline-form');
            if (container) {
                container.innerHTML = '';
            }
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
                    loadFlaggedCars(); // Refresh to update notification status
                    setLoading(false);
                },
                handleNotifyFailure: (error) => {
                    showBanner(`Failed to send notification: ${error}`, 'error');
                    setLoading(false);
                }
            });
        } catch (error) {
            console.error('Notify error:', error);
            showBanner('Failed to send notification. Please try again.', 'error');
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isAdminView = location.pathname.startsWith('/admin');

    const getCarZone = useCallback((car) => {
        const zone = car.location || car.valet_id?.parkZoneCode;
        return zone?.trim() || t('admin.unknownZone');
    }, [t]);

    const flaggedCarsByZone = useMemo(() => {
        if (!isAdminView) return null;

        const grouped = flaggedCars.reduce((acc, car) => {
            const zone = getCarZone(car);
            if (!acc[zone]) acc[zone] = [];
            acc[zone].push(car);
            return acc;
        }, {});

        const unknownZone = t('admin.unknownZone');
        return Object.keys(grouped).sort((a, b) => {
            if (a === unknownZone) return 1;
            if (b === unknownZone) return -1;
            return a.localeCompare(b);
        }).map((zoneCode) => ({ zoneCode, cars: grouped[zoneCode] }));
    }, [flaggedCars, getCarZone, isAdminView, t]);

    const renderFlaggedTable = (cars) => (
        <table className="cars-table">
            <thead>
                <tr>
                    <th>{t('valet.licensePlate')}</th>
                    <th>{t('valet.phoneNumber')}</th>
                    <th>{t('valet.parkedAt')}</th>
                    <th>{t('valet.checkedOutAt')}</th>
                    <th>{t('valet.parkingFee')}</th>
                    <th>{t('valet.actions')}</th>
                </tr>
            </thead>
            <tbody>
                {cars.map((car) => {
                    const fee = calculateFee(car);
                    return (
                        <tr key={car._id}>
                            <td className="license-plate">{car.licensePlate || `${car.plateCode || ''}-${car.region || ''}-${car.licensePlateNumber || ''}`}</td>
                            <td>{car.phoneNumber || 'N/A'}</td>
                            <td>{formatDateTime(car.parkedAt)}</td>
                            <td>{formatDateTime(car.checkedOutAt)}</td>
                            <td>{fee.totalWithVat.toFixed(2)} ETB</td>
                            <td>
                                <div className="actions actions-flagged">
                                    <button
                                        className="btn-action btn-pay"
                                        onClick={() => handlePayNow(car)}
                                        disabled={loading}
                                    >
                                        <CreditCard size={16} />
                                        {t('valet.payNow')}
                                    </button>
                                    <button
                                        className="btn-action btn-notify"
                                        onClick={() => handleNotify(car)}
                                        disabled={loading || car.notificationSent}
                                    >
                                        <Bell size={16} />
                                        {car.notificationSent ? t('valet.notified') : t('valet.notify')}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    return (
        <div className="parked-cars-list">
            {/* Alert banner - fixed at top */}
            {banner && (
                <div className={`alert-banner alert-banner-${banner.type}`} role="alert">
                    <span className="alert-banner-message">{banner.message}</span>
                    <button
                        type="button"
                        className="alert-banner-dismiss"
                        onClick={dismissBanner}
                        aria-label="Dismiss"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>{t('valet.flaggedCustomers')}</h1>
                    <p>{t('valet.unpaidParking')}</p>
                </div>
                <button
                    onClick={loadFlaggedCars}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: '1px solid #667eea',
                        background: '#667eea',
                        color: '#fff',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                        opacity: loading ? 0.6 : 1
                    }}
                >
                    {t('common.refresh')}
                </button>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p>{t('common.loading')}</p>
                </div>
            )}

            <div className="cars-table-container">
                {!loading && flaggedCars.length > 0 ? (
                    isAdminView ? (
                        <div className="flagged-zone-groups">
                            {flaggedCarsByZone.map(({ zoneCode, cars }) => (
                                <div key={zoneCode} className="flagged-zone-group">
                                    <h3 className="flagged-zone-header">
                                        {t('admin.flaggedInZone')}: <span className="zone-code">{zoneCode}</span>
                                        <span className="zone-count">({cars.length})</span>
                                    </h3>
                                    {renderFlaggedTable(cars)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderFlaggedTable(flaggedCars)
                    )
                ) : !loading ? (
                    <div className="no-data">
                        <AlertTriangle size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
                        <p>{t('valet.noFlaggedCars')}</p>
                    </div>
                ) : null}
            </div>

            {/* Payment Form Modal - Chapa inline payment */}
            {showPaymentFormModal && selectedCar && feeDetails && (
                <div className="payment-modal-overlay" onClick={handleClosePaymentFormModal}>
                    <div className="payment-form-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('valet.completePayment')}</h2>
                            <button 
                                className="close-btn" 
                                onClick={handleClosePaymentFormModal} 
                                disabled={loading}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <div className="payment-summary-section">
                                <h3>{t('valet.paymentSummary')}</h3>
                                <div className="summary-row">
                                    <span className="label">{t('valet.totalAmount')}:</span>
                                    <span className="value">{feeDetails.totalWithVat.toFixed(2)} ETB</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">{t('valet.phoneNumber')}:</span>
                                    <span className="value">{selectedCar.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">{t('valet.licensePlate')}:</span>
                                    <span className="value">{selectedCar.licensePlate || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="chapa-payment-form-section">
                                <h3>{t('valet.payOnline')}</h3>
                                <div id="chapa-inline-form"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PaymentSuccessModal
                show={showPaymentSuccessModal}
                message={paymentSuccessDetails.message}
                amount={paymentSuccessDetails.amount}
                onClose={handlePaymentSuccessClose}
            />
        </div>
    );
};

export default FlaggedCustomers;

