import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { updateParkedCarRecord, flagParkedCarRecord } from '../../api/api';
import { getApiError } from '../../api/client';
import { queuePaymentSuccess } from '../../utils/paymentSuccessQueue';
import { useCurrentUser } from '../../hooks/useAuth';
import { useBanner } from '../../hooks/useBanner';
import { useChapaPayment } from '../../hooks/useChapaPayment';
import {
    useParkedCarsQuery,
    useDailyStatsQuery,
    usePricingSettingsQuery,
    useInvalidateParkingQueries,
} from '../../hooks/queries';
import AlertBanner from '../../components/ui/AlertBanner';
import ChapaPaymentModal from '../../components/payment/ChapaPaymentModal';
import {
    ParkedCarsStatCards,
    ParkedCarsFilterBar,
    ParkedCarsTable,
    ParkedCarsStatusModal,
    ParkedCarsCheckoutModal,
    dedupeCars,
    filterParkedCars,
    calculateParkingFee,
    canParkIn,
    getLicensePlate,
    DEFAULT_PRICING_SETTINGS,
} from './parkedCarsModules';
import '../../styles/parkedCarsList.scss';
import '../../styles/valetOverview.scss';

const EMPTY_DAILY_STATS = {
    totalParked: 0,
    checkedOut: 0,
    stillParked: 0,
    onlinePayments: 0,
};

const ParkedCarsList = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const navigate = useNavigate();
    const { banner, showBanner, dismissBanner } = useBanner();
    const { invalidateAll } = useInvalidateParkingQueries();

    const [filter, setFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedCar, setSelectedCar] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [feeDetails, setFeeDetails] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [parkInLoadingId, setParkInLoadingId] = useState(null);

    const parkedCarsParams = useMemo(() => ({
        status: filter !== 'all' ? filter : null,
        date: selectedDate,
    }), [filter, selectedDate]);

    const {
        data: rawCars = [],
        isLoading: carsLoading,
        isFetching: carsFetching,
    } = useParkedCarsQuery(user?.token, parkedCarsParams);

    const { data: dailyStats = EMPTY_DAILY_STATS } = useDailyStatsQuery(user?.token, selectedDate);
    const { data: pricingData } = usePricingSettingsQuery();

    const pricingSettings = pricingData && typeof pricingData === 'object'
        ? pricingData
        : DEFAULT_PRICING_SETTINGS;

    const cars = useMemo(() => dedupeCars(rawCars), [rawCars]);
    const loading = carsLoading || carsFetching || actionLoading;

    useEffect(() => {
        window.vatRate = pricingSettings?.vatRate ?? 0.15;
    }, [pricingSettings]);

    const calculateFee = useCallback(
        (car) => calculateParkingFee(car, pricingSettings),
        [pricingSettings]
    );

    const filteredCars = useMemo(
        () => filterParkedCars(cars, { serviceFilter, searchQuery }),
        [cars, serviceFilter, searchQuery]
    );

    const refreshParkingData = useCallback(() => {
        invalidateAll();
    }, [invalidateAll]);

    const handlePaymentComplete = useCallback((paidFee) => {
        refreshParkingData();
        setSelectedCar(null);
        setFeeDetails(null);
        queuePaymentSuccess({
            message: t('valet.paymentSuccessful'),
            amount: paidFee.totalWithVat,
        });
    }, [refreshParkingData, t]);

    const { startPayment, closePayment } = useChapaPayment({
        mode: 'car',
        user,
        setLoading: setActionLoading,
        setShowPaymentFormModal,
        onError: (message) => showBanner(message, 'error'),
        onCarPaymentComplete: handlePaymentComplete,
    });

    const handleCheckOut = async (car) => {
        const isPackageCar = car.serviceType === 'package' && (car.packageDuration || car.packageSubscriptionId);
        if (isPackageCar) {
            setActionLoading(true);
            try {
                await updateParkedCarRecord(car._id, { status: 'checked_out' }, user.token);
                refreshParkingData();
            } catch (err) {
                showBanner(getApiError(err, 'Failed to check out.'), 'error');
            } finally {
                setActionLoading(false);
            }
            return;
        }

        setSelectedCar(car);
        setFeeDetails(calculateFee(car));
        setShowCheckoutModal(true);
    };

    const handleStatusChange = (car, status) => {
        if (status === 'checked_out') {
            handleCheckOut(car);
            return;
        }
        setSelectedCar(car);
        setNewStatus(status);
        setShowStatusModal(true);
    };

    const handleParkIn = async (car) => {
        if (!car?._id || !user?.token || !canParkIn(car)) return;

        setParkInLoadingId(car._id);
        try {
            await updateParkedCarRecord(car._id, { status: 'parked' }, user.token);
            refreshParkingData();
        } catch (err) {
            showBanner(getApiError(err, t('messages.operationFailed')), 'error');
        } finally {
            setParkInLoadingId(null);
        }
    };

    const handlePayNow = () => {
        if (!selectedCar) return;
        const fee = feeDetails || calculateFee(selectedCar);
        setShowCheckoutModal(false);
        startPayment({ car: selectedCar, feeDetails: fee, variant: 'checkout' });
    };

    const handleFlagHim = async () => {
        if (!selectedCar) return;
        const details = feeDetails || calculateFee(selectedCar);
        setFeeDetails(details);
        setActionLoading(true);

        try {
            await flagParkedCarRecord(
                selectedCar._id,
                {
                    baseAmount: details.parkingFee,
                    vatAmount: details.vatAmount,
                    totalWithVat: details.totalWithVat,
                },
                user.token
            );
            refreshParkingData();
            setShowCheckoutModal(false);
            setSelectedCar(null);
            setFeeDetails(null);
        } catch (err) {
            showBanner(getApiError(err, 'Failed to flag car'), 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const confirmStatusChange = async () => {
        if (!selectedCar || !newStatus) return;

        try {
            await updateParkedCarRecord(selectedCar._id, { status: newStatus }, user.token);
            refreshParkingData();
            setShowStatusModal(false);
            setSelectedCar(null);
        } catch (err) {
            showBanner(getApiError(err, 'Failed to update status'), 'error');
        }
    };

    const checkoutFeeDetails = feeDetails || (selectedCar ? calculateFee(selectedCar) : null);

    return (
        <div className="parked-cars-list parked-cars-list--v2">
            <AlertBanner banner={banner} onDismiss={dismissBanner} />

            <ParkedCarsStatCards t={t} dailyStats={dailyStats} />

            <ParkedCarsFilterBar
                t={t}
                filter={filter}
                serviceFilter={serviceFilter}
                searchQuery={searchQuery}
                selectedDate={selectedDate}
                filteredCount={filteredCars.length}
                totalCount={cars.length}
                onFilterChange={setFilter}
                onServiceFilterChange={setServiceFilter}
                onSearchChange={setSearchQuery}
                onDateChange={setSelectedDate}
            />

            {loading && (
                <div className="loading-indicator">
                    <p>{t('common.loading')}</p>
                </div>
            )}

            <ParkedCarsTable
                t={t}
                loading={loading}
                filteredCars={filteredCars}
                searchQuery={searchQuery}
                serviceFilter={serviceFilter}
                parkInLoadingId={parkInLoadingId}
                calculateFee={calculateFee}
                onCheckOut={(car) => handleStatusChange(car, 'checked_out')}
                onParkIn={handleParkIn}
                onRegisterCar={() => navigate('/valet/register-car')}
            />

            <ParkedCarsStatusModal
                t={t}
                isOpen={showStatusModal}
                newStatus={newStatus}
                onClose={() => setShowStatusModal(false)}
                onConfirm={confirmStatusChange}
            />

            <ParkedCarsCheckoutModal
                t={t}
                isOpen={showCheckoutModal}
                feeDetails={checkoutFeeDetails}
                loading={actionLoading}
                onClose={() => setShowCheckoutModal(false)}
                onPayNow={handlePayNow}
                onFlagHim={handleFlagHim}
            />

            <ChapaPaymentModal
                t={t}
                isOpen={showPaymentFormModal}
                loading={actionLoading}
                onClose={() => !actionLoading && closePayment()}
                totalAmount={feeDetails?.totalWithVat}
                phoneNumber={selectedCar?.phoneNumber}
                licensePlate={selectedCar ? getLicensePlate(selectedCar) : undefined}
            />
        </div>
    );
};

export default ParkedCarsList;
