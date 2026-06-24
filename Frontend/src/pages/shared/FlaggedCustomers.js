import React, { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notifyFlaggedCustomerRecord } from '../../api/api';
import { getApiError } from '../../api/client';
import { queuePaymentSuccess } from '../../utils/paymentSuccessQueue';
import { useCurrentUser } from '../../hooks/useAuth';
import { useBanner } from '../../hooks/useBanner';
import { useChapaPayment } from '../../hooks/useChapaPayment';
import { useFlaggedCarsQuery, useInvalidateFlaggedCars } from '../../hooks/queries';
import AlertBanner from '../../components/ui/AlertBanner';
import { AlertTriangle, RefreshCw } from 'lucide-react';
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
import '../../styles/flaggedCustomers.scss';

const FlaggedCustomers = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const user = useCurrentUser();
    const { banner, showBanner, dismissBanner } = useBanner();
    const invalidateFlaggedCars = useInvalidateFlaggedCars();

    const [searchQuery, setSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCar, setSelectedCar] = useState(null);
    const [feeDetails, setFeeDetails] = useState(null);
    const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const unknownZone = t('admin.unknownZone');

    const {
        data: flaggedCars = [],
        isLoading,
        isFetching,
        refetch,
    } = useFlaggedCarsQuery(user?.token);

    const loading = isLoading || isFetching || actionLoading;

    const refreshFlaggedCars = useCallback(() => {
        invalidateFlaggedCars();
    }, [invalidateFlaggedCars]);

    const { startPayment, closePayment } = useChapaPayment({
        mode: 'car',
        user,
        t,
        setLoading: setActionLoading,
        setShowPaymentFormModal,
        returnUrl: `${window.location.origin}${location.pathname}`,
        onError: (message) => showBanner(message, 'error'),
        onSmsFailed: (message) => showBanner(message, 'warning'),
        onFlaggedPaymentComplete: (fee) => {
            refreshFlaggedCars();
            setSelectedCar(null);
            setFeeDetails(null);
            queuePaymentSuccess({
                message: t('valet.paymentSuccessful'),
                amount: fee.totalWithVat,
            });
        },
    });

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
            startPayment({ car, feeDetails: fee, variant: 'flagged' });
        }, 100);
    };

    const handleClosePaymentFormModal = () => {
        closePayment(true);
        setActionLoading(false);
    };

    const handleNotify = async (car) => {
        if (!car._id || !user?.token) return;

        setActionLoading(true);
        try {
            await notifyFlaggedCustomerRecord(car._id, user.token);
            showBanner(t('valet.notificationSent'), 'success');
            refreshFlaggedCars();
        } catch (err) {
            showBanner(`Failed to send notification: ${getApiError(err)}`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExport = () => {
        if (filteredCars.length === 0) return;
        exportFlaggedCsv(filteredCars, t);
    };

    return (
        <div className="flagged-customers">
            <AlertBanner banner={banner} onDismiss={dismissBanner} />

            <div className="flagged-page-header">
                <div>
                    <h1>{t('valet.flaggedCustomers')}</h1>
                    <p>{t('valet.flaggedCustomersSubtitle')}</p>
                </div>
                <button
                    type="button"
                    className="flagged-btn flagged-btn--refresh"
                    onClick={() => refetch()}
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
                loading={actionLoading}
                onClose={handleClosePaymentFormModal}
            />
        </div>
    );
};

export default FlaggedCustomers;
