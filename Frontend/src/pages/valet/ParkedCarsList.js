import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchParkedCars, updateParkedCar, sendSmsNotification, initializeChapaPayment, CHAPA_BACKEND_CALLBACK_URL, fetchDailyStats, fetchPricingSettings, flagParkedCar, verifyChapaPayment } from '../../api/api';
import { EthiopianDatePicker } from '../../components';
import { queuePaymentSuccess } from '../../utils/paymentSuccessQueue';
import { Car, Clock, Package, X, Search, LogOut, MoreVertical } from 'lucide-react';
import '../../css/parkedCarsList.scss';
import '../../css/valetOverview.scss';

const ParkedCarsList = () => {
    const { t } = useTranslation();
    const user = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [cars, setCars] = useState([]);
    const [filter, setFilter] = useState('all'); // all, parked, checked_out
    const [serviceFilter, setServiceFilter] = useState('all'); // all, hourly, package
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [selectedCar, setSelectedCar] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false); // New modal for Pay Now / Flag Him
    const [feeDetails, setFeeDetails] = useState(null);
    const [parkInLoadingId, setParkInLoadingId] = useState(null);
    const chapaInstanceRef = useRef(null);
    const lastChapaErrorRef = useRef(null); // Store last Chapa API error response
    const [dailyStats, setDailyStats] = useState({
        totalParked: 0,
        checkedOut: 0,
        stillParked: 0,
        onlinePayments: 0,
    });

    const [pricingSettings, setPricingSettings] = useState({});
    const [banner, setBanner] = useState(null); // { message, type: 'error'|'success' }

    const showBanner = useCallback((message, type = 'error') => {
        setBanner({ message, type });
        setTimeout(() => setBanner(null), 6000);
    }, []);

    const dismissBanner = useCallback(() => setBanner(null), []);

    // Dedupe cars: same licensePlate + parkedAt (to minute) = duplicate (keep first by _id)
    const dedupeCars = useCallback((list) => {
        if (!list?.length) return list;
        const seen = new Set();
        return list.filter((car) => {
            const plate = car.licensePlate || `${car.plateCode || ''}-${car.region || ''}-${car.licensePlateNumber || ''}`;
            const parkedMin = car.parkedAt ? new Date(car.parkedAt).setSeconds(0, 0) : 0;
            const key = `${plate}|${parkedMin}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, []);

    const loadCars = useCallback(() => {
        if (!user?.token) return;
        setLoading(true);
        const status = filter !== 'all' ? filter : null;
        fetchParkedCars({
            token: user.token,
            status,
            date: selectedDate,
            setParkedCars: (data) => {
                setCars(dedupeCars(data || []));
                setLoading(false);
            },
            handleError: () => setLoading(false),
        });
    }, [user?.token, filter, selectedDate, dedupeCars]);

    const filteredCars = useMemo(() => {
        let result = cars;

        if (serviceFilter === 'hourly') {
            result = result.filter((car) => car.serviceType !== 'package');
        } else if (serviceFilter === 'package') {
            result = result.filter((car) => car.serviceType === 'package');
        }

        const query = searchQuery.trim().toLowerCase();
        if (query) {
            result = result.filter((car) => {
                const plate = (car.licensePlate || `${car.plateCode || ''}-${car.region || ''}-${car.licensePlateNumber || ''}`).toLowerCase();
                const phone = (car.phoneNumber || '').toLowerCase();
                const model = (car.model || '').toLowerCase();
                return plate.includes(query) || phone.includes(query) || model.includes(query);
            });
        }

        return result;
    }, [cars, serviceFilter, searchQuery]);

    useEffect(() => {
        if (user?.token) {
            loadCars();
            // Fetch daily statistics for the selected date
            fetchDailyStats({ token: user.token, date: selectedDate, setDailyStats });
        }
        // Fetch pricing settings (no auth required)
        fetchPricingSettings({
            setPricingSettings: (data) => {
                // Store pricing settings as-is (car type based structure)
                // Structure: {carType: {hourly: price, weekly: price, monthly: price, yearly: price}}
                if (data && typeof data === 'object') {
                    setPricingSettings(data);
                } else {
                    // Default fallback for car types
                    setPricingSettings({
                        tripod: { hourly: 50, weekly: 0, monthly: 0, yearly: 0 },
                        automobile: { hourly: 50, weekly: 0, monthly: 0, yearly: 0 },
                        truck: { hourly: 75, weekly: 0, monthly: 0, yearly: 0 },
                        trailer: { hourly: 100, weekly: 0, monthly: 0, yearly: 0 },
                        special_vehicles: { hourly: 75, weekly: 0, monthly: 0, yearly: 0 }
                    });
                }
                // Store VAT rate from backend
                if (data && data.vatRate !== undefined) {
                    // Store in component state if needed, or use directly
                    window.vatRate = data.vatRate;
                } else {
                    window.vatRate = 0.15; // Default
                }
            }
        });
    }, [user, filter, selectedDate, loadCars]);


    const calculateFee = (car) => {
        const parkedAt = new Date(car.parkedAt);
        const now = new Date();

        // Duration in minutes and human readable text
        const diffMs = now - parkedAt;
        const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60))); // Minimum 1 minute
        const durationHours = Math.floor(totalMinutes / 60);
        const durationMins = totalMinutes % 60;
        const durationText = `${durationHours} Hours ${durationMins} Min`;
        
        // Get valet's price level from car (valet_id is populated)
        const valetPriceLevel = car.valet_id?.priceLevel || null;
        const carType = car.carType || 'automobile';
        
        // Get pricing from price level structure: pricingSettings.priceLevels[priceLevel][carType]
        let carPricing = {};
        if (valetPriceLevel && pricingSettings?.priceLevels && pricingSettings.priceLevels[valetPriceLevel]) {
            carPricing = pricingSettings.priceLevels[valetPriceLevel][carType] || {};
        } else {
            // Fallback: try first available price level or use defaults
            const priceLevelNames = pricingSettings?.priceLevels ? Object.keys(pricingSettings.priceLevels) : [];
            if (priceLevelNames.length > 0) {
                carPricing = pricingSettings.priceLevels[priceLevelNames[0]][carType] || {};
            }
        }
        
        let parkingFee = 0;
        let pricePerHour = 0;

        // Check if car has package service
        if (car.serviceType === 'package' && car.packageDuration) {
            // Package service - use package price from price level
            const packagePrice = carPricing[car.packageDuration] || 0;
            parkingFee = packagePrice;
            pricePerHour = 0; // Not applicable for packages
        } else {
            // Hourly service - calculate based on time parked
            pricePerHour = carPricing.hourly || 50; // Default fallback
        const hoursParked = totalMinutes / 60;
            parkingFee = Math.round((hoursParked * pricePerHour) * 100) / 100;
        }

        // Get VAT rate from backend settings (stored in window.vatRate) or use default
        const vatRate = window.vatRate || 0.15;
        const vatAmount = Math.round(parkingFee * vatRate * 100) / 100;
        const totalWithVat = Math.round((parkingFee + vatAmount) * 100) / 100;

        return {
            hoursParked: totalMinutes / 60,
            pricePerHour,
            parkingFee,
            vatAmount,
            totalWithVat,
            durationText,
            parkedAt: parkedAt.toLocaleString(),
            checkedOutAt: now.toLocaleString(),
            serviceType: car.serviceType || 'hourly',
            packageDuration: car.packageDuration || null
        };
    };

    const handleStatusChange = (car, status) => {
        if (status === 'checked_out') {
            const isPackageCar = car.serviceType === 'package' && (car.packageDuration || car.packageSubscriptionId);
            if (isPackageCar) {
                setLoading(true);
                updateParkedCar({
                    id: car._id,
                    body: { status: 'checked_out' },
                    token: user.token,
                    handleUpdateParkedCarSuccess: () => {
                        loadCars();
                        fetchDailyStats({ token: user.token, date: selectedDate, setDailyStats });
                        setLoading(false);
                    },
                    handleUpdateParkedCarFailure: (err) => {
                        showBanner(err || 'Failed to check out.', 'error');
                        setLoading(false);
                    }
                });
                return;
            }
            // Hourly (or any non-package): show checkout modal with Pay Now / Flag Him
            const fee = calculateFee(car);
            setSelectedCar(car);
            setFeeDetails(fee);
            setShowCheckoutModal(true);
        } else {
            setSelectedCar(car);
            setNewStatus(status);
            setShowStatusModal(true);
        }
    };

    const canParkIn = (car) => {
        if (car.status !== 'checked_out') return false;
        if (car.serviceType === 'package' && car.packageEndDate) {
            return new Date(car.packageEndDate) > new Date();
        }
        return true;
    };

    const handleParkIn = (car) => {
        if (!car?._id || !user?.token || !canParkIn(car)) return;
        setParkInLoadingId(car._id);
        updateParkedCar({
            id: car._id,
            body: { status: 'parked' },
            token: user.token,
            handleUpdateParkedCarSuccess: () => {
                setParkInLoadingId(null);
                loadCars();
                fetchDailyStats({ token: user.token, date: selectedDate, setDailyStats });
            },
            handleUpdateParkedCarFailure: (err) => {
                setParkInLoadingId(null);
                showBanner(err || t('messages.operationFailed'), 'error');
            }
        });
    };

    const handlePayNow = () => {
        if (!selectedCar) return;
        setShowCheckoutModal(false);
        handlePaymentMethod('online');
    };

    const handleFlagHim = async () => {
        if (!selectedCar) return;
        const details = feeDetails || calculateFee(selectedCar);
        setFeeDetails(details);

        setLoading(true);
        try {
            await flagParkedCar({
                id: selectedCar._id,
                baseAmount: details.parkingFee,
                vatAmount: details.vatAmount,
                totalWithVat: details.totalWithVat,
                token: user?.token,
                handleFlagSuccess: () => {
                    // Refresh cars list and stats
                    loadCars();
                    fetchDailyStats({ token: user.token, date: selectedDate, setDailyStats });
                    setShowCheckoutModal(false);
                    setSelectedCar(null);
                    setFeeDetails(null);
                },
                handleFlagFailure: (error) => {
                    showBanner(error || 'Failed to flag car', 'error');
                }
            });
        } catch (error) {
            console.error('Flag car error:', error);
            showBanner('Failed to flag car. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmStatusChange = () => {
        if (selectedCar && newStatus) {
            updateParkedCar({
                id: selectedCar._id,
                body: { status: newStatus },
                token: user.token,
                handleUpdateParkedCarSuccess: () => {
                    loadCars();
                    fetchDailyStats({ token: user.token, date: selectedDate, setDailyStats });
                    setShowStatusModal(false);
                    setSelectedCar(null);
                },
                handleUpdateParkedCarFailure: (error) => {
                    showBanner(error || 'Failed to update status', 'error');
                }
            });
        }
    };

    const handlePaymentMethod = async (paymentMethod) => {
        if (!selectedCar) return;
        const feeToUse = feeDetails || calculateFee(selectedCar);
        if (!feeToUse) return;

        setLoading(true);
        
        try {
            // Clean up any existing payment data and Chapa instances to prevent txRef reuse
            if (chapaInstanceRef.current) {
                const container = document.getElementById('chapa-inline-form');
                if (container) {
                    container.innerHTML = '';
                }
                chapaInstanceRef.current = null;
            }
            // Clear old localStorage entries for this car to ensure fresh payment
            localStorage.removeItem(`chapa_payment_${selectedCar._id}`);
            // Clear any stored error from previous attempts
            lastChapaErrorRef.current = null;
                
            // Initialize Chapa payment for online payment
                const customerName = selectedCar.customerName || 'Customer';
                const customerEmail = selectedCar.customerEmail || `${selectedCar.phoneNumber}@tana-parking.com`;
                const customerPhone = selectedCar.phoneNumber;

                await initializeChapaPayment({
                    carId: selectedCar._id,
                    amount: feeToUse.totalWithVat,
                    customerName: customerName,
                    customerEmail: customerEmail,
                    customerPhone: customerPhone,
                    token: user?.token,
                    handleInitSuccess: async (data) => {
                        // Store payment reference for later verification
                        localStorage.setItem(`chapa_payment_${selectedCar._id}`, JSON.stringify({
                            txRef: data.txRef,
                            carId: selectedCar._id,
                            feeDetails: feeToUse,
                            customerPhone: selectedCar.phoneNumber || customerPhone,
                            initiatedAt: Date.now(),
                        }));

                        // Get Chapa public key from API response or environment variables
                        // Backend should provide publicKey in the response, fallback to env variable
                        const chapaPublicKey = data.publicKey || process.env.REACT_APP_CHAPA_PUBLIC_KEY;
                        
                        console.log('Chapa config check:', {
                            hasPublicKey: !!chapaPublicKey,
                            publicKeyLength: chapaPublicKey?.length,
                            txRef: data.txRef,
                            txRefLength: data.txRef?.length,
                            txRefTimestamp: data.txRef ? new Date().toISOString() : null,
                            amount: feeToUse.totalWithVat,
                            customerPhone: customerPhone
                        });
                        console.log('✅ Backend generated NEW txRef:', data.txRef);
                        
                        if (!chapaPublicKey) {
                            console.error('Chapa public key is not configured. Please add CHAPA_PUBLIC_KEY to backend .env or REACT_APP_CHAPA_PUBLIC_KEY to frontend .env');
                            showBanner('Payment service is temporarily unavailable. Please try again.', 'error');
                            setLoading(false);
                            return;
                        }
                        
                        // Validate public key format
                        console.log('🔑 Public key received from backend:', chapaPublicKey ? `${chapaPublicKey.substring(0, 20)}...` : 'MISSING');
                        console.log('🔑 Full public key length:', chapaPublicKey?.length);
                        console.log('🔑 Public key source:', data.publicKey ? 'Backend API response' : 'Frontend env variable');
                        
                        const isValidTestKey = chapaPublicKey.startsWith('CHAPUBK_TEST-');
                        const isValidLiveKey = chapaPublicKey.startsWith('CHAPUBK-');
                        if (!isValidTestKey && !isValidLiveKey) {
                            console.error('❌ Public key format is INCORRECT!');
                            console.error('Expected format: CHAPUBK_TEST-... (test) or CHAPUBK-... (live)');
                            console.error('Current key starts with:', chapaPublicKey.substring(0, 15));
                            console.error('Full key:', chapaPublicKey);
                            showBanner('Payment service is temporarily unavailable. Please try again.', 'error');
                            setLoading(false);
                            return;
                        } else {
                            console.log('✅ Public key format is valid:', isValidTestKey ? 'TEST MODE' : 'LIVE MODE');
                        }
                        
                        if (!data.txRef) {
                            console.error('Missing txRef from payment initialization');
                            showBanner('Payment initialization failed. Missing transaction reference.', 'error');
                            setLoading(false);
                            return;
                        }

                        // Initialize Chapa Inline.js
                        try {
                            // Clean up any existing instance
                            if (chapaInstanceRef.current) {
                                const container = document.getElementById('chapa-inline-form');
                                if (container) {
                                    container.innerHTML = '';
                                }
                            }

                            // Get ChapaCheckout from window (loaded via CDN) or try to import
                            let ChapaCheckout;
                            
                            if (window.ChapaCheckout) {
                                ChapaCheckout = window.ChapaCheckout;
                            } else {
                                // Wait for script to load (max 3 seconds)
                                let attempts = 0;
                                await new Promise((resolve, reject) => {
                                    const checkInterval = setInterval(() => {
                                        attempts++;
                                        if (window.ChapaCheckout) {
                                            clearInterval(checkInterval);
                                            ChapaCheckout = window.ChapaCheckout;
                                            resolve();
                                        } else if (attempts > 30) { // 3 seconds max
                                            clearInterval(checkInterval);
                                            reject(new Error('Chapa library failed to load'));
                                        }
                                    }, 100);
                                });
                            }
                            
                            if (!ChapaCheckout) {
                                showBanner('Chapa payment library is not loaded. Please refresh the page.', 'error');
                                setLoading(false);
                                return;
                            }

                            // Verify ChapaCheckout is the correct constructor
                            console.log('ChapaCheckout type:', typeof ChapaCheckout);
                            console.log('ChapaCheckout:', ChapaCheckout);
                            console.log('window.ChapaCheckout:', window.ChapaCheckout);
                            
                            // Check if Chapa script loaded correctly
                            if (typeof ChapaCheckout !== 'function') {
                                console.error('ChapaCheckout is not a function!', ChapaCheckout);
                                showBanner('Chapa library is not properly loaded. Please refresh the page.', 'error');
                                setLoading(false);
                                return;
                            }

                            // Validate and format amount
                            const amountNum = parseFloat(feeToUse.totalWithVat);
                            if (isNaN(amountNum) || amountNum <= 0) {
                                throw new Error(`Invalid amount: ${feeToUse.totalWithVat}`);
                            }
                            // Chapa Inline.js expects amount as a string with 2 decimal places
                            const formattedAmount = amountNum.toFixed(2);
                            
                            // Validate phone number format
                            // CRITICAL: Chapa test mode requires LOCAL format with leading 0 (0900112233)
                            // Chapa Inline.js strips the leading 0 if we pass E.164 format (+251900112233)
                            // So for test mode, we MUST use local format (0900112233)
                            const isTestMode = chapaPublicKey.startsWith('CHAPUBK_TEST-');
                            let formattedPhone = customerPhone;
                            
                            if (isTestMode) {
                                // TEST MODE: Use local format with leading 0 (0900112233)
                                // Ensure phone starts with 0 for Ethiopian numbers
                                if (formattedPhone.startsWith('+251')) {
                                    // Convert E.164 to local: +251900112233 -> 0900112233
                                    formattedPhone = '0' + formattedPhone.substring(4);
                                } else if (!formattedPhone.startsWith('0')) {
                                    // Add leading 0 if missing: 900112233 -> 0900112233
                                    formattedPhone = '0' + formattedPhone;
                                }
                                // Keep as-is if already in local format (0900112233)
                            } else {
                                // LIVE MODE: Use E.164 format (+251900112233)
                                if (formattedPhone && !formattedPhone.startsWith('+')) {
                                    // Convert local to E.164: 0900112233 -> +251900112233
                                    formattedPhone = formattedPhone.replace(/^0/, '+251');
                                    if (!formattedPhone.startsWith('+')) {
                                        formattedPhone = `+251${formattedPhone}`;
                                    }
                                }
                            }
                            
                            // Log phone number format for debugging
                            console.log('📱 Phone number formatting:', {
                                original: customerPhone,
                                formatted: formattedPhone,
                                format: formattedPhone.startsWith('+') ? 'E.164' : formattedPhone.startsWith('0') ? 'Local' : 'Other',
                                isTestMode: isTestMode,
                                note: isTestMode ? 'Using LOCAL format (0...) for Chapa test mode' : 'Using E.164 format (+251...) for live mode'
                            });
                            
                            const generatedEmail = `${formattedPhone.replace(/[^0-9]/g, '')}@tana-parking.com`;

                            // Chapa Inline.js configuration - using camelCase (primary format)
                            // Chapa Inline.js accepts camelCase and converts internally as needed
                            const chapaConfig = {
                                // Public key (required)
                                publicKey: chapaPublicKey,
                                
                                // Transaction reference (required)
                                // Provide both camelCase and snake_case to match Chapa Inline.js expectations.
                                txRef: data.txRef,
                                tx_ref: data.txRef,
                                
                                // Amount and currency (required)
                                amount: formattedAmount, // Must be string
                                currency: 'ETB',
                                
                                // Customer information (required)
                                phoneNumber: formattedPhone,
                                firstName: 'Customer',
                                lastName: 'User',
                                email: generatedEmail,
                                
                                // Payment methods (optional - restricts available methods)
                                availablePaymentMethods: ['telebirr', 'cbebirr', 'ebirr', 'mpesa'],
                                
                                // UI customizations (optional)
                                customizations: {
                                    title: 'Tana Parking Payment',
                                    description: `Parking fee payment for ${selectedCar.licensePlate || 'your vehicle'}`,
                                    buttonText: 'Pay Now',
                                    styles: `
                                        .chapa-pay-button { 
                                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                            color: white;
                                            border: none;
                                            padding: 16px 24px;
                                            border-radius: 10px;
                                            font-size: 16px;
                                            font-weight: 700;
                                            cursor: pointer;
                                            width: 100%;
                                            transition: all 0.3s ease;
                                        }
                                        .chapa-pay-button:hover {
                                            transform: translateY(-2px);
                                            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                                        }
                                    `
                                },
                                
                                // Backend callback for Chapa; returnUrl goes to dashboard (inline JS handles checkout + SMS)
                                callbackUrl: `${CHAPA_BACKEND_CALLBACK_URL}?carId=${selectedCar._id}`,
                                callback_url: `${CHAPA_BACKEND_CALLBACK_URL}?carId=${selectedCar._id}`,
                                returnUrl: `${window.location.origin}${window.location.pathname}`,
                                return_url: `${window.location.origin}${window.location.pathname}`,
                                
                                // UI options (optional)
                                showFlag: true,
                                showPaymentMethodsNames: true,
                                
                                // JavaScript callbacks (Chapa Inline.js supports these)
                                onSuccessfulPayment: async (response) => {
                                    console.log('✅ Payment successful (onSuccessfulPayment):', response);
                                    const chapaTxRef = response?.tx_ref || response?.txRef || data.txRef;

                                    const finishCheckout = async () => {
                                        let smsMessage = '';

                                        if (selectedCar.serviceType === 'package' && selectedCar.packageDuration) {
                                            let remainingDaysText = '';
                                            if (selectedCar.packageEndDate) {
                                                const now = new Date();
                                                const end = new Date(selectedCar.packageEndDate);
                                                const diffMs = end.getTime() - now.getTime();
                                                const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                                                const endDisplay = end.toLocaleDateString();
                                                remainingDaysText = `Package expires on ${endDisplay} (${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining).`;
                                            }

                                            const licenseDisplay = selectedCar.licensePlate || `${selectedCar.plateCode || ''}-${selectedCar.region || ''}-${selectedCar.licensePlateNumber || ''}`;
                                            smsMessage = `Thank you for using Tana Parking services!\nYour package car (${licenseDisplay}) has checked out.\nPackage type: ${selectedCar.packageDuration}.\n${remainingDaysText}`;
                                        } else {
                                            const totalMinutes = Math.round(feeToUse.hoursParked * 60);
                                            const durationDisplay = totalMinutes >= 60 
                                                ? `${Math.floor(totalMinutes / 60)} hour${Math.floor(totalMinutes / 60) > 1 ? 's' : ''} ${totalMinutes % 60 > 0 ? `${totalMinutes % 60} min` : ''}`.trim()
                                                : `${totalMinutes} min`;
                                            smsMessage = `Thank you for using Tana Parking services! Your car (${selectedCar.licensePlate || `${selectedCar.plateCode || ''}-${selectedCar.region || ''}-${selectedCar.licensePlateNumber || ''}`}) has been received.\nParking fee: ${feeToUse.parkingFee.toFixed(2)} ETB\nVAT (15%): ${feeToUse.vatAmount.toFixed(2)} ETB\nTotal: ${feeToUse.totalWithVat.toFixed(2)} ETB (${durationDisplay} × ${feeToUse.pricePerHour} ETB/hour).\nPayment method: Online Payment.`;
                                        }
                                        
                                        await sendSmsNotification({
                                            phoneNumber: selectedCar.phoneNumber,
                                            message: smsMessage,
                                            token: user?.token,
                                            handleSendSmsSuccess: () => {
                                                console.log('SMS sent successfully');
                                            },
                                            handleSendSmsFailure: (error) => {
                                                console.error('Failed to send SMS:', error);
                                            }
                                        });

                                        loadCars();
                                        fetchDailyStats({ token: user.token, date: selectedDate, setDailyStats });

                                        setShowPaymentFormModal(false);
                                        if (chapaInstanceRef.current) {
                                            const container = document.getElementById('chapa-inline-form');
                                            if (container) container.innerHTML = '';
                                            chapaInstanceRef.current = null;
                                        }

                                        localStorage.removeItem(`chapa_payment_${selectedCar._id}`);
                                        setSelectedCar(null);
                                        setFeeDetails(null);
                                        setLoading(false);

                                        queuePaymentSuccess({
                                            message: t('valet.paymentSuccessful'),
                                            amount: feeToUse.totalWithVat,
                                        });
                                    };

                                    const fallbackUpdate = () => updateParkedCar({
                                        id: selectedCar._id,
                                        body: {
                                            status: 'checked_out',
                                            paymentMethod: 'online',
                                            totalPaidAmount: feeToUse.totalWithVat,
                                        },
                                        token: user?.token,
                                        handleUpdateParkedCarSuccess: finishCheckout,
                                        handleUpdateParkedCarFailure: (error) => {
                                            console.error('Failed to update car:', error);
                                            showBanner('Payment successful but failed to update car status. Please contact support.', 'error');
                                            setLoading(false);
                                        }
                                    });

                                    if (chapaTxRef) {
                                        await verifyChapaPayment({
                                            txRef: chapaTxRef,
                                            carId: selectedCar._id,
                                            token: user?.token,
                                            handleVerifySuccess: finishCheckout,
                                            handleVerifyFailure: () => fallbackUpdate()
                                        });
                                    } else {
                                        await fallbackUpdate();
                                    }
                                },
                                onPaymentFailure: (error) => {
                                    console.error('❌ Payment failed - error received:', error);
                                    
                                    // Get detailed error from stored API response
                                    const storedError = lastChapaErrorRef.current;
                                    let chapaDetailedMessage = null;
                                    
                                    if (storedError) {
                                        // Extract detailed message from Chapa's API response structure
                                        chapaDetailedMessage = storedError?.data?.meta?.message || 
                                                             storedError?.message;
                                        console.error('❌ Payment failed - Chapa API error details:', storedError);
                                    }
                                    
                                    // Try to extract from error object if available
                                    if (!chapaDetailedMessage) {
                                        if (error?.data?.meta?.message) {
                                            chapaDetailedMessage = error.data.meta.message;
                                        } else if (error?.data?.data?.meta?.message) {
                                            chapaDetailedMessage = error.data.data.meta.message;
                                        } else if (error?.response?.data?.data?.meta?.message) {
                                            chapaDetailedMessage = error.response.data.data.meta.message;
                                        } else if (error?.response?.data?.meta?.message) {
                                            chapaDetailedMessage = error.response.data.meta.message;
                                        }
                                    }
                                    
                                    // Clean up on failure to ensure fresh txRef on retry
                                    if (selectedCar?._id) {
                                        localStorage.removeItem(`chapa_payment_${selectedCar._id}`);
                                    }
                                    if (chapaInstanceRef.current) {
                                        const container = document.getElementById('chapa-inline-form');
                                        if (container) {
                                            container.innerHTML = '';
                                        }
                                        chapaInstanceRef.current = null;
                                    }
                                    
                                    // Clear stored error after use
                                    lastChapaErrorRef.current = null;
                                    
                                    // Extract error message - prioritize Chapa's detailed message
                                    let errorMessage = chapaDetailedMessage || 
                                                     error?.message || 
                                                     (typeof error === 'string' ? error : 'Payment failed. Please try again.');
                                    
                                    // Add helpful context for common test mode errors
                                    const errorMsgLower = errorMessage.toLowerCase();
                                    const phoneNumber = selectedCar?.phoneNumber || 'N/A';
                                    
                                    if (errorMsgLower.includes('invalid test number') || 
                                        errorMsgLower.includes('invalid otp') || 
                                        errorMsgLower.includes('payment method')) {
                                        let helpText = '\n\n⚠️ TEST MODE REQUIREMENTS:\n';
                                        helpText += `• Phone number used: ${phoneNumber}\n`;
                                        helpText += '• Valid test numbers:\n';
                                        helpText += '  - telebirr/cbebirr/ebirr: 0900112233, 0900123456, 0900881111\n';
                                        helpText += '  - mpesa: 0700112233, 0700123456, 0700881111\n';
                                        helpText += '• Make sure the payment method matches the phone number prefix:\n';
                                        helpText += '  - 09xxx = telebirr/cbebirr/ebirr\n';
                                        helpText += '  - 07xxx = mpesa\n';
                                        helpText += '• Check your Chapa dashboard to ensure payment methods are enabled for test mode';
                                        errorMessage += helpText;
                                    }
                                    
                                    showBanner(`Payment failed: ${errorMessage}`, 'error');
                                    setLoading(false);
                                },
                                onClose: () => {
                                    console.log('🔒 Payment modal closed');
                                    setShowPaymentFormModal(false);
                                    setLoading(false);
                                },
                                onPaymentClose: () => {
                                    console.log('🔒 Payment modal closed (onPaymentClose)');
                                    setShowPaymentFormModal(false);
                                    setLoading(false);
                                }
                            };
                            
                            console.log('Chapa config being passed:', {
                                publicKey: chapaPublicKey ? `${chapaPublicKey.substring(0, 20)}...` : 'MISSING',
                                publicKeyFull: chapaPublicKey, // Full key for debugging
                                amount: formattedAmount,
                                amountType: typeof formattedAmount,
                                currency: chapaConfig.currency,
                                txRef: chapaConfig.txRef,
                                tx_ref: chapaConfig.tx_ref,
                                txRefLength: chapaConfig.txRef?.length,
                                phoneNumber: formattedPhone,
                                phone_number: chapaConfig.phone_number,
                                firstName: chapaConfig.firstName,
                                first_name: chapaConfig.first_name,
                                lastName: chapaConfig.lastName,
                                last_name: chapaConfig.last_name,
                                email: chapaConfig.email,
                                callbackUrl: chapaConfig.callbackUrl,
                                callback_url: chapaConfig.callback_url,
                                returnUrl: chapaConfig.returnUrl,
                                return_url: chapaConfig.return_url,
                                hasOnSuccessfulPayment: !!chapaConfig.onSuccessfulPayment,
                                hasOnPaymentFailure: !!chapaConfig.onPaymentFailure,
                                hasOnClose: !!chapaConfig.onClose
                            });
                            
                            // Log the exact config object that will be passed to ChapaCheckout
                            console.log('📋 Full Chapa config object (for debugging):', JSON.stringify({
                                ...chapaConfig,
                                publicKey: chapaPublicKey ? `${chapaPublicKey.substring(0, 15)}...` : 'MISSING',
                                onSuccessfulPayment: '[Function]',
                                onPaymentFailure: '[Function]',
                                onClose: '[Function]'
                            }, null, 2));
                            
                            // Validate public key format: Inline.js must use a valid public key.
                            const isTestKey = chapaPublicKey.startsWith('CHAPUBK_TEST-');
                            const isLiveKey = chapaPublicKey.startsWith('CHAPUBK-') || chapaPublicKey.startsWith('CHAPUBK_LIVE-');

                            if (!chapaPublicKey || (!isTestKey && !isLiveKey)) {
                                console.error('Invalid Chapa PUBLIC key format. Expected CHAPUBK_TEST-* (test) or CHAPUBK-* / CHAPUBK_LIVE-* (live)');
                                console.error('Current key prefix:', chapaPublicKey ? chapaPublicKey.slice(0, 12) : 'MISSING');
                                showBanner('Payment service is temporarily unavailable. Please try again.', 'error');
                                setLoading(false);
                                return;
                            }
                            
                            // Log full config for debugging (mask sensitive data)
                            console.log('Full Chapa config (masked):', {
                                ...chapaConfig,
                                publicKey: chapaPublicKey ? `${chapaPublicKey.substring(0, 15)}...` : 'MISSING',
                                onSuccessfulPayment: chapaConfig.onSuccessfulPayment ? '[Function]' : 'MISSING',
                                onPaymentFailure: chapaConfig.onPaymentFailure ? '[Function]' : 'MISSING',
                                onClose: chapaConfig.onClose ? '[Function]' : 'MISSING'
                            });
                            
                            try {
                                // Validate config before creating ChapaCheckout instance
                                const requiredFields = ['publicKey', 'amount', 'currency', 'txRef', 'email', 'firstName', 'lastName'];
                                const missingFields = requiredFields.filter(field => !chapaConfig[field] && !chapaConfig[field.replace(/([A-Z])/g, '_$1').toLowerCase()]);
                                
                                if (missingFields.length > 0) {
                                    console.error('❌ Missing required Chapa fields:', missingFields);
                                    showBanner(`Payment configuration error: Missing required fields (${missingFields.join(', ')}). Please contact support.`, 'error');
                                    setLoading(false);
                                    return;
                                }
                                
                                console.log('✅ All required Chapa fields present');
                                console.log('🔧 Creating ChapaCheckout instance with config keys:', Object.keys(chapaConfig));
                                console.log('🔑 Public key in config (public_key):', chapaConfig.public_key ? `${chapaConfig.public_key.substring(0, 20)}...` : 'MISSING');
                                console.log('🔑 Full public key value:', chapaConfig.public_key);
                                
                                const chapa = new ChapaCheckout(chapaConfig);
                            chapaInstanceRef.current = chapa;
                                
                                console.log('✅ ChapaCheckout instance created successfully');
                                console.log('🔑 Chapa instance internal options:', {
                                    publicKey: chapa.options?.public_key || chapa.options?.publicKey || 'NOT FOUND',
                                    public_key: chapa.options?.public_key || 'NOT FOUND',
                                    hasPublicKey: !!(chapa.options?.public_key || chapa.options?.publicKey)
                                });
                            
                            // Open payment form modal
                            setShowPaymentFormModal(true);
                            
                            // Wait for DOM to update, then initialize Chapa
                            setTimeout(() => {
                                const container = document.getElementById('chapa-inline-form');
                                if (container) {
                                        console.log('Initializing Chapa Inline.js...');
                                        console.log('Container element:', container);
                                        console.log('Chapa instance:', chapa);
                                        
                                        try {
                                            // Monitor both XMLHttpRequest and fetch (Chapa might use either)
                                            const originalXHROpen = XMLHttpRequest.prototype.open;
                                            const originalXHRSend = XMLHttpRequest.prototype.send;
                                            const originalFetch = window.fetch;
                                            
                                            // Monitor XMLHttpRequest
                                            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                                                if (url && (url.includes('chapa') || url.includes('inline.chapaservices'))) {
                                                    console.log('🔍 [XHR] Chapa API Request:', method, url);
                                                    this._chapaUrl = url;
                                                    this._chapaMethod = method;
                                                }
                                                return originalXHROpen.apply(this, [method, url, ...args]);
                                            };
                                            
                                            XMLHttpRequest.prototype.send = function(data) {
                                                if (this._chapaUrl) {
                                                    console.log('📤 [XHR] Chapa Request Data:', data ? (typeof data === 'string' ? data : JSON.stringify(data)) : 'No data');
                                                    
                                                    this.addEventListener('load', function() {
                                                        console.log('📥 [XHR] Chapa Response Status:', this.status, this.statusText);
                                                        console.log('📥 [XHR] Chapa Response URL:', this._chapaUrl);
                                                        try {
                                                            const responseText = this.responseText;
                                                            console.log('📥 [XHR] Chapa Response Body:', responseText);
                                                            if (responseText) {
                                                                try {
                                                                    const jsonResponse = JSON.parse(responseText);
                                                                    console.log('📥 [XHR] Chapa Response JSON:', jsonResponse);
                                                                } catch (e) {
                                                                    console.log('📥 [XHR] Chapa Response (not JSON):', responseText);
                                                                }
                                                            }
                                                        } catch (e) {
                                                            console.error('Error reading Chapa response:', e);
                                                        }
                                                    });
                                                    
                                                    this.addEventListener('error', function() {
                                                        console.error('❌ [XHR] Chapa Request Error:', this._chapaUrl);
                                                    });
                                                }
                                                return originalXHRSend.apply(this, [data]);
                                            };
                                            
                                            // Monitor fetch
                                            window.fetch = function(url, options = {}) {
                                                if (typeof url === 'string' && (url.includes('chapa') || url.includes('inline.chapaservices'))) {
                                                    console.log('🔍 [FETCH] Chapa API Request:', url);
                                                    console.log('📤 [FETCH] Chapa Request Method:', options.method || 'GET');
                                                    
                                                    // Parse and log the request body
                                                    if (options.body) {
                                                        try {
                                                            let bodyData;
                                                            if (typeof options.body === 'string') {
                                                                console.log('📤 [FETCH] Request body is string, length:', options.body.length);
                                                                bodyData = JSON.parse(options.body);
                                                            } else if (options.body instanceof FormData) {
                                                                console.log('📤 [FETCH] Request body is FormData');
                                                                bodyData = {};
                                                                for (let [key, value] of options.body.entries()) {
                                                                    bodyData[key] = value;
                                                                }
                                                            } else {
                                                                bodyData = options.body;
                                                            }
                                                            
                                                            console.log('📤 [FETCH] Chapa Request Body (parsed):', bodyData);
                                                            console.log('📤 [FETCH] Request body keys:', Object.keys(bodyData));
                                                            
                                                            // Log ALL FormData values for debugging
                                                            console.log('📋 [FETCH] Full FormData values:', Object.entries(bodyData).map(([k, v]) => {
                                                                const valueStr = typeof v === 'string' ? (v.length > 100 ? v.substring(0, 100) + '...' : v) : JSON.stringify(v);
                                                                return `${k}: ${valueStr}`;
                                                            }).join(', '));
                                                            
                                                            // Log phone number specifically
                                                            const phoneInBody = bodyData.phone_number || bodyData.phoneNumber || bodyData.phone || bodyData.mobile;
                                                            if (phoneInBody) {
                                                                console.log('📱 [FETCH] Phone number being sent:', phoneInBody);
                                                                console.log('📱 [FETCH] Phone number format:', phoneInBody.startsWith('+') ? 'E.164 (+251...)' : phoneInBody.startsWith('0') ? 'Local (0...)' : 'Other');
                                                                console.log('📱 [FETCH] Phone number length:', phoneInBody.length);
                                                            } else {
                                                                console.warn('⚠️ [FETCH] Phone number not found in request body!');
                                                                console.log('📤 [FETCH] Available keys:', Object.keys(bodyData));
                                                                console.log('📤 [FETCH] Full body values:', Object.entries(bodyData).map(([k, v]) => `${k}: ${typeof v === 'string' ? v.substring(0, 50) : v}`));
                                                            }
                                                            
                                                            // Log payment method being used
                                                            const paymentMethod = bodyData.payment_method || bodyData.paymentMethod || bodyData.method || bodyData.type;
                                                            if (paymentMethod) {
                                                                console.log('💳 [FETCH] Payment method being sent:', paymentMethod);
                                                            } else {
                                                                console.warn('⚠️ [FETCH] Payment method not found in request body!');
                                                            }
                                                            
                                                            // Check public key in request body (optional - key is usually in headers)
                                                            const publicKeyInBody = bodyData.public_key || bodyData.publicKey;
                                                            if (publicKeyInBody) {
                                                                console.log('🔑 [FETCH] Public key found in request body:', publicKeyInBody.substring(0, 20) + '...');
                                                            } else {
                                                                // This is normal - Chapa Inline.js sends public key in Authorization header, not body
                                                                console.log('ℹ️ [FETCH] Public key not in request body (normal - sent in Authorization header instead)');
                                                            }
                                                        } catch (e) {
                                                            console.error('❌ [FETCH] Error parsing request body:', e);
                                                            console.log('📤 [FETCH] Chapa Request Body (raw, unparsed):', options.body);
                                                        }
                                                    } else {
                                                        console.warn('⚠️ [FETCH] No request body found!');
                                                    }
                                                    
                                                    console.log('📤 [FETCH] Chapa Request Headers:', options.headers);
                                                    
                                                    // Check if public key is in headers
                                                    if (options.headers) {
                                                        const headersObj = options.headers instanceof Headers 
                                                            ? Object.fromEntries(options.headers.entries())
                                                            : options.headers;
                                                        console.log('📤 [FETCH] Headers object:', headersObj);
                                                        const authHeader = headersObj['Authorization'] || headersObj['authorization'] || headersObj['x-public-key'] || headersObj['X-Public-Key'];
                                                        if (authHeader) {
                                                            console.log('🔑 [FETCH] Public key found in headers:', authHeader);
                                                        }
                                                    }
                                                    
                                                    return originalFetch.apply(this, arguments)
                                                        .then(response => {
                                                            console.log('📥 [FETCH] Chapa Response Status:', response.status, response.statusText);
                                                            console.log('📥 [FETCH] Chapa Response URL:', response.url);
                                                            
                                                            // Clone response to read body without consuming it
                                                            const clonedResponse = response.clone();
                                                            clonedResponse.text().then(text => {
                                                                console.log('📥 [FETCH] Chapa Response Status:', response.status);
                                                                console.log('📥 [FETCH] Chapa Response Body (raw):', text);
                                                                
                                                                try {
                                                                    const jsonResponse = JSON.parse(text);
                                                                    console.log('📥 [FETCH] Chapa Response JSON:', jsonResponse);
                                                                    console.log('📥 [FETCH] Chapa Response keys:', Object.keys(jsonResponse));
                                                                    
                                                                    // Log ALL error details
                                                                    if (jsonResponse.message) {
                                                                        console.error('❌ [FETCH] Chapa Error Message:', jsonResponse.message);
                                                                    }
                                                                    if (jsonResponse.error) {
                                                                        console.error('❌ [FETCH] Chapa Error:', jsonResponse.error);
                                                                    }
                                                                    if (jsonResponse.status) {
                                                                        console.error('❌ [FETCH] Chapa Status:', jsonResponse.status);
                                                                    }
                                                                    if (jsonResponse.data) {
                                                                        console.error('❌ [FETCH] Chapa Data:', jsonResponse.data);
                                                                    }
                                                                    
                                                                    // Log the full response for debugging
                                                                    console.error('❌ [FETCH] FULL CHAPA ERROR RESPONSE:', JSON.stringify(jsonResponse, null, 2));
                                                                    
                                                                    // Store error response for error handler
                                                                    if (jsonResponse.status === 'failed' || jsonResponse.message) {
                                                                        lastChapaErrorRef.current = jsonResponse;
                                                                    }
                                                                } catch (e) {
                                                                    // Not JSON, that's okay - log as text
                                                                    console.error('❌ [FETCH] Chapa Response (not JSON, raw text):', text);
                                                                }
                                                            }).catch(err => {
                                                                console.error('❌ Error reading fetch response:', err);
                                                            });
                                                            
                                                            return response;
                                                        })
                                                        .catch(error => {
                                                            console.error('❌ [FETCH] Chapa Request Error:', error);
                                                            throw error;
                                                        });
                                                }
                                                return originalFetch.apply(this, arguments);
                                            };
                                            
                                    chapa.initialize('chapa-inline-form');
                                            console.log('Chapa initialize() called successfully');
                                            
                                            // Restore original functions after a delay
                                            setTimeout(() => {
                                                XMLHttpRequest.prototype.open = originalXHROpen;
                                                XMLHttpRequest.prototype.send = originalXHRSend;
                                                window.fetch = originalFetch;
                                            }, 15000);
                                            
                                    setLoading(false);
                                        } catch (initError) {
                                            console.error('Error during chapa.initialize():', initError);
                                            console.error('Init error details:', {
                                                message: initError?.message,
                                                stack: initError?.stack,
                                                name: initError?.name,
                                                cause: initError?.cause
                                            });
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
                                console.error('Error details:', {
                                    message: initError?.message,
                                    stack: initError?.stack,
                                    name: initError?.name
                                });
                                showBanner(`Failed to initialize payment: ${initError?.message || 'Unknown error'}`, 'error');
                                setShowPaymentFormModal(false);
                                setLoading(false);
                            }
                        } catch (error) {
                            console.error('Failed to initialize Chapa Inline:', error);
                            showBanner('Failed to load payment form. Please try again.', 'error');
                            setLoading(false);
                        }
                    },
                    handleInitFailure: (error) => {
                        console.error('Failed to initialize Chapa payment:', error);
                        showBanner(`Failed to initialize payment: ${error}`, 'error');
                        setLoading(false);
                    }
                });
        } catch (error) {
            console.error('Error processing payment:', error);
            showBanner('An error occurred. Please try again.', 'error');
            setLoading(false);
        }
    };

    const handleClosePaymentModal = () => {
        if (!loading) {
            setShowPaymentModal(false);
            setSelectedCar(null);
            setFeeDetails(null);
        }
    };

    const handleClosePaymentFormModal = () => {
        if (!loading) {
            // Clean up Chapa instance
            if (chapaInstanceRef.current) {
                const container = document.getElementById('chapa-inline-form');
                if (container) {
                    container.innerHTML = '';
                }
                chapaInstanceRef.current = null;
            }
            setShowPaymentFormModal(false);
        }
    };


    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatSparkline = ({ color }) => (
        <svg className="stat-sparkline" viewBox="0 0 80 24" aria-hidden="true">
            <polyline
                points="0,18 10,15 20,16 30,11 40,13 50,9 60,10 70,7 80,5"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );

    return (
        <div className="parked-cars-list parked-cars-list--v2">
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
            <div className="stats-summary-grid">
                <div className="stat-summary-card stat-summary-card--total">
                    <div className="stat-summary-icon">P</div>
                    <div className="stat-summary-body">
                        <span className="stat-summary-label">{t('valet.totalParked')}</span>
                        <span className="stat-summary-value">{dailyStats.totalParked}</span>
                        <span className="stat-summary-hint">{t('valet.statAllTimeEntries')}</span>
                    </div>
                    <StatSparkline color="#3b82f6" />
                </div>
                <div className="stat-summary-card stat-summary-card--parked">
                    <div className="stat-summary-icon"><Car size={22} /></div>
                    <div className="stat-summary-body">
                        <span className="stat-summary-label">{t('valet.stillParked')}</span>
                        <span className="stat-summary-value">{dailyStats.stillParked}</span>
                        <span className="stat-summary-hint">{t('valet.statCurrentlyInPark')}</span>
                    </div>
                    <StatSparkline color="#22c55e" />
                </div>
                <div className="stat-summary-card stat-summary-card--checked">
                    <div className="stat-summary-icon"><LogOut size={22} /></div>
                    <div className="stat-summary-body">
                        <span className="stat-summary-label">{t('valet.checkedOut')}</span>
                        <span className="stat-summary-value">{dailyStats.checkedOut}</span>
                        <span className="stat-summary-hint">{t('valet.statToday')}</span>
                    </div>
                    <StatSparkline color="#8b5cf6" />
                </div>
            </div>

            <div className="control-panel">
                <div className="control-panel-top">
                    <div className="segment-filters">
                        <div className="segment-group">
                            <span className="segment-label">{t('valet.status')}</span>
                            <div className="segment-buttons">
                                <button type="button" className={`segment-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>{t('valet.all')}</button>
                                <button type="button" className={`segment-btn ${filter === 'parked' ? 'active' : ''}`} onClick={() => setFilter('parked')}>
                                    <span className="status-dot status-dot--parked" />{t('valet.parked')}
                                </button>
                                <button type="button" className={`segment-btn ${filter === 'checked_out' ? 'active' : ''}`} onClick={() => setFilter('checked_out')}>
                                    <span className="status-dot status-dot--checked" />{t('valet.checkedOut')}
                                </button>
                            </div>
                        </div>
                        <div className="segment-group">
                            <span className="segment-label">{t('valet.serviceType')}</span>
                            <div className="segment-buttons">
                                <button type="button" className={`segment-btn ${serviceFilter === 'all' ? 'active' : ''}`} onClick={() => setServiceFilter('all')}>{t('valet.all')}</button>
                                <button type="button" className={`segment-btn ${serviceFilter === 'hourly' ? 'active' : ''}`} onClick={() => setServiceFilter('hourly')}>
                                    <Clock size={14} />{t('valet.hourly')}
                                </button>
                                <button type="button" className={`segment-btn ${serviceFilter === 'package' ? 'active' : ''}`} onClick={() => setServiceFilter('package')}>
                                    <Package size={14} />{t('valet.package')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="control-panel-bottom">
                    <div className="search-filter">
                        <Search size={18} className="search-filter-icon" />
                        <input
                            type="text"
                            className="search-filter-input"
                            placeholder={t('valet.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button type="button" className="search-filter-clear" onClick={() => setSearchQuery('')} aria-label={t('common.cancel')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <div className="date-selector">
                        <EthiopianDatePicker value={selectedDate} onChange={(date) => setSelectedDate(date)} label="Select Date" />
                    </div>
                </div>
                {(serviceFilter !== 'all' || searchQuery) && (
                    <p className="filters-result-count">{t('valet.showingResults', { count: filteredCars.length, total: cars.length })}</p>
                )}
            </div>

            {loading && (
                <div className="loading-indicator">
                    <p>{t('common.loading')}</p>
                </div>
            )}

            <div className="table-card">
                <div className="table-card-header">
                    <Car size={20} />
                    <h2>{t('valet.parkedCars')}</h2>
                </div>
                <div className="table-card-body">
                    {!loading && filteredCars.length > 0 ? (
                        <>
                            <div className="mobile-car-list">
                                {filteredCars.map((car) => {
                                    const fee = car.status === 'checked_out'
                                        ? `${car.totalPaidAmount?.toFixed(2) || '0.00'} ETB`
                                        : `${calculateFee(car).totalWithVat.toFixed(2)} ETB`;
                                    return (
                                        <article key={car._id} className="mobile-car-card">
                                            <div className="mobile-car-card-top">
                                                <span className="plate-badge">{car.licensePlate}</span>
                                                <span className={`status-pill status-pill--${car.status}`}>
                                                    <span className="status-dot" />
                                                    {car.status === 'checked_out' ? t('valet.checkedOut') : t('valet.parked')}
                                                </span>
                                                <button type="button" className="mobile-car-menu" aria-label={t('valet.actions')}>
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                            <div className="mobile-car-card-body">
                                                <strong>{car.model || '-'}</strong>
                                                <span className="mobile-car-meta">
                                                    {formatDateTime(car.parkedAt)} · {fee}
                                                </span>
                                            </div>
                                            <div className="mobile-car-card-actions">
                                                {car.status === 'parked' ? (
                                                    <button
                                                        type="button"
                                                        className="btn-action btn-checkout"
                                                        onClick={() => handleStatusChange(car, 'checked_out')}
                                                    >
                                                        {t('valet.checkOut')}
                                                    </button>
                                                ) : canParkIn(car) ? (
                                                    <button
                                                        type="button"
                                                        className="btn-action btn-park-in"
                                                        onClick={() => handleParkIn(car)}
                                                        disabled={parkInLoadingId === car._id}
                                                    >
                                                        {parkInLoadingId === car._id ? t('common.loading') : t('valet.parkIn')}
                                                    </button>
                                                ) : null}
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            <div className="desktop-table-view">
                                <table className="cars-table cars-table--v2">
                                    <thead>
                                        <tr>
                                            <th>{t('valet.licensePlate')}</th>
                                            <th>{t('valet.vehicle')}</th>
                                            <th>{t('valet.parkedAt')}</th>
                                            <th>{t('valet.checkedOutAt')}</th>
                                            <th>{t('valet.parkingFee')}</th>
                                            <th>{t('valet.status')}</th>
                                            <th>{t('valet.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCars.map((car) => (
                                            <tr key={car._id}>
                                                <td>
                                                    <span className="plate-badge">{car.licensePlate}</span>
                                                </td>
                                                <td>
                                                    <div className="vehicle-info">
                                                        <strong>{car.model || '-'}</strong>
                                                        {car.color && <span className="color">{car.color}</span>}
                                                    </div>
                                                </td>
                                                <td>{formatDateTime(car.parkedAt)}</td>
                                                <td>{car.checkedOutAt ? formatDateTime(car.checkedOutAt) : '-'}</td>
                                                <td className="fee-cell">
                                                    {car.status === 'checked_out'
                                                        ? `${car.totalPaidAmount?.toFixed(2) || '0.00'} ETB`
                                                        : `${calculateFee(car).totalWithVat.toFixed(2)} ETB`}
                                                </td>
                                                <td>
                                                    <span className={`status-pill status-pill--${car.status}`}>
                                                        <span className="status-dot" />
                                                        {car.status === 'checked_out' ? t('valet.checkedOut') : t('valet.parked')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions">
                                                        {car.status === 'parked' ? (
                                                            <button
                                                                type="button"
                                                                className="btn-action btn-checkout"
                                                                onClick={() => handleStatusChange(car, 'checked_out')}
                                                            >
                                                                {t('valet.checkOut')}
                                                            </button>
                                                        ) : canParkIn(car) ? (
                                                            <button
                                                                type="button"
                                                                className="btn-action btn-park-in"
                                                                onClick={() => handleParkIn(car)}
                                                                disabled={parkInLoadingId === car._id}
                                                            >
                                                                {parkInLoadingId === car._id ? t('common.loading') : t('valet.parkIn')}
                                                            </button>
                                                        ) : (
                                                            <span className="action-muted">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : !loading ? (
                        <div className="no-data">
                            <p>{searchQuery || serviceFilter !== 'all' ? t('valet.noFilterResults') : t('valet.noParkedCars')}</p>
                            <button type="button" className="btn-primary" onClick={() => navigate('/valet/register-car')}>
                                {t('valet.registerFirstCar')}
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Status Change Modal */}
            {showStatusModal && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('valet.changeStatus')}</h3>
                        <p>{t('messages.confirmDelete')} <strong>{newStatus.replace('_', ' ')}</strong>?</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowStatusModal(false)}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-confirm" onClick={confirmStatusChange}>
                                {t('common.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal - Pay Now / Flag Him (hourly cars only) */}
            {showCheckoutModal && selectedCar && (
                (() => {
                    const details = feeDetails || calculateFee(selectedCar);
                    return (
                <div className="checkout-modal-overlay" onClick={() => !loading && setShowCheckoutModal(false)}>
                    <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="checkout-modal-header">
                            <h3>{t('valet.checkOut')} - {t('valet.paymentDetails')}</h3>
                            <p>{t('valet.selectPaymentOption')}</p>
                        </div>
                        
                        <div className="checkout-modal-body">
                            <div className="payment-details-section">
                                <h3>{t('valet.paymentDetails')}</h3>
                                <div className="detail-row">
                                    <span className="label">{t('valet.parkingFee')}:</span>
                                    <span className="value">{details.parkingFee.toFixed(2)} ETB</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">VAT:</span>
                                    <span className="value">{details.vatAmount.toFixed(2)} ETB</span>
                                </div>
                                <div className="detail-row total-fee">
                                    <span className="label">{t('common.total')}:</span>
                                    <span className="value">{details.totalWithVat.toFixed(2)} ETB</span>
                                </div>
                            </div>

                            <div className="checkout-buttons-row">
                                <button 
                                    type="button"
                                    className="btn-checkout-pay"
                                    onClick={handlePayNow}
                                    disabled={loading}
                                >
                                    {t('valet.payNow')}
                                </button>
                                <button 
                                    type="button"
                                    className="btn-checkout-flag"
                                    onClick={handleFlagHim}
                                    disabled={loading}
                                >
                                    {loading ? t('common.loading') : t('valet.flagHim')}
                                </button>
                            </div>
                        </div>

                        <div className="checkout-modal-footer">
                            <button 
                                className="btn-checkout-cancel" 
                                onClick={() => !loading && setShowCheckoutModal(false)}
                                disabled={loading}
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
                    );
                })()
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedCar && feeDetails && (
                <div className="payment-modal-overlay" onClick={handleClosePaymentModal}>
                    <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{t('valet.parkedOut')} - {t('valet.paymentDetails')}</h2>
                            <button className="close-btn" onClick={handleClosePaymentModal} disabled={loading}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            <div className="parking-details-section">
                                <h3>Parking Detail</h3>
                                <div className="detail-row">
                                    <span className="label">Parking Zone:</span>
                                    <span className="value">{selectedCar.location || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="vehicle-details-section">
                                <h3>Vehicle Detail</h3>
                                <div className="detail-row">
                                    <span className="label">Phone Number:</span>
                                    <span className="value">{selectedCar.phoneNumber || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Plate Number:</span>
                                    <span className="value">{selectedCar.licensePlate || `${selectedCar.plateCode || ''}-${selectedCar.region || ''}-${selectedCar.licensePlateNumber || ''}`}</span>
                                </div>
                            </div>

                            <div className="duration-section">
                                <h3>Duration</h3>
                                <div className="detail-row">
                                    <span className="label">Start Time:</span>
                                    <span className="value">{feeDetails.parkedAt}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">End Time:</span>
                                    <span className="value">{feeDetails.checkedOutAt}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Duration:</span>
                                    <span className="value">{feeDetails.durationText}</span>
                                </div>
                            </div>

                            <div className="payment-details-section">
                                <h3>Payment Detail</h3>
                                <div className="detail-row">
                                    <span className="label">Parking Fee:</span>
                                    <span className="value">{feeDetails.parkingFee.toFixed(2)} ETB</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">VAT (15%):</span>
                                    <span className="value">{feeDetails.vatAmount.toFixed(2)} ETB</span>
                                </div>
                                <div className="detail-row total-fee">
                                    <span className="label">Total:</span>
                                    <span className="value">{feeDetails.totalWithVat.toFixed(2)} ETB</span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Payment Form Modal - Separate modal for Chapa inline payment */}
            {showPaymentFormModal && selectedCar && feeDetails && (
                <div className="payment-modal-overlay" onClick={handleClosePaymentFormModal}>
                    <div className="payment-form-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Complete Payment</h2>
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
                                <h3>Payment Summary</h3>
                                <div className="summary-row">
                                    <span className="label">Total Amount:</span>
                                    <span className="value">{feeDetails.totalWithVat.toFixed(2)} ETB</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">Phone Number:</span>
                                    <span className="value">{selectedCar.phoneNumber || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="chapa-payment-form-section">
                                <h3>Complete Payment Online</h3>
                                <div id="chapa-inline-form"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ParkedCarsList;

