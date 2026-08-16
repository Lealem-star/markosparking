import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createParkedCarRecord, sendSms } from '../../api/api';
import { getApiError } from '../../api/client';
import { useCurrentUser } from '../../hooks/useAuth';
import { useBanner } from '../../hooks/useBanner';
import { usePricingSettingsQuery } from '../../hooks/queries';
import { useChapaPayment } from '../../hooks/useChapaPayment';
import ChapaPaymentModal from '../../components/payment/ChapaPaymentModal';
import AlertBanner from '../../components/ui/AlertBanner';
import { getParkingOfficerRoutePath } from '../../utils/rolePaths';
import {
    RegisterCarForm,
    RegisterCarServiceModal,
    RegisterCarPackageModal,
    EMPTY_FORM,
    resolvePlateCodesFromPricing,
    buildHourlyRegistrationSms,
    getFormLicenseDisplay,
    PACKAGE_DURATIONS,
} from './registerCarModules';
import '../../styles/registerCar.scss';

const RegisterCar = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const navigate = useNavigate();

    const [formData, setFormData] = useState(EMPTY_FORM);
    const { data: pricingData } = usePricingSettingsQuery();
    const pricingSettings = useMemo(() => {
        if (pricingData && typeof pricingData === 'object' && pricingData.priceLevels) {
            return pricingData;
        }
        return { priceLevels: {} };
    }, [pricingData]);
    const plateCodes = useMemo(
        () => resolvePlateCodesFromPricing(pricingData),
        [pricingData]
    );
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [serviceType, setServiceType] = useState('');
    const [packageDuration, setPackageDuration] = useState('');
    const [showPaymentFormModal, setShowPaymentFormModal] = useState(false);
    const [packagePaymentAmount, setPackagePaymentAmount] = useState(0);
    const [packageTxRef, setPackageTxRef] = useState('');
    const { banner, showBanner, dismissBanner } = useBanner();

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setServiceType('');
        setPackageDuration('');
        setLoading(false);
    };

    const { startPayment, closePayment } = useChapaPayment({
        mode: 'package',
        user,
        formData,
        pricingSettings,
        t,
        setLoading,
        setShowPaymentFormModal,
        loading,
        onError: setError,
        onSmsFailed: (message) => showBanner(message, 'warning'),
        onPackagePaymentComplete: resetForm,
        onPaymentInitialized: ({ txRef, amount }) => {
            setPackageTxRef(txRef);
            setPackagePaymentAmount(amount);
        },
        onPaymentClosed: () => {
            setPackageTxRef('');
            setPackagePaymentAmount(0);
        },
    });

    useEffect(() => {
        window.vatRate = pricingData?.vatRate ?? 0.15;
    }, [pricingData]);

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        setError('');
        setSuccess('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.plateCode || !formData.region || !formData.licensePlateNumber || !formData.phoneNumber || !formData.carType) {
            setError(t('valet.fillAllFields'));
            return;
        }

        setShowServiceModal(true);
    };

    const handleServiceTypeSelect = (type) => {
        setServiceType(type);
        if (type === 'package') {
            setShowServiceModal(false);
            setShowPackageModal(true);
            return;
        }

        setPackageDuration('');
        setShowServiceModal(false);
        createHourlyCar();
    };

    const handlePackageDurationSelect = (duration) => {
        setPackageDuration(duration);
        setShowPackageModal(false);
        startPayment({ duration });
    };

    const createHourlyCar = async () => {
        setLoading(true);
        const validatedPackageDuration = serviceType === 'package'
            && PACKAGE_DURATIONS.includes(packageDuration)
            ? packageDuration
            : null;

        try {
            await createParkedCarRecord({
                ...formData,
                serviceType: serviceType || 'hourly',
                packageDuration: validatedPackageDuration,
            }, user?.token);

            setSuccess('Car registered successfully!');

            try {
                await sendSms(
                    formData.phoneNumber,
                    buildHourlyRegistrationSms(formData),
                    user?.token
                );
            } catch (smsErr) {
                showBanner(
                    `${t('messages.smsFailed')} ${getApiError(smsErr)}`.trim(),
                    'warning'
                );
            }

                                        resetForm();
            setTimeout(() => navigate(getParkingOfficerRoutePath('dashboard')), 1500);
        } catch (err) {
            setError(getApiError(err, 'Failed to register car'));
            setLoading(false);
        }
    };

    return (
        <div className="register-car">
            <AlertBanner banner={banner} onDismiss={dismissBanner} />
            <div className="form-container">
                {success && <div className="alert alert-success">{success}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <RegisterCarForm
                    t={t}
                    formData={formData}
                    plateCodes={plateCodes}
                    loading={loading}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate(getParkingOfficerRoutePath('dashboard'))}
                            />
                        </div>

            <RegisterCarServiceModal
                t={t}
                isOpen={showServiceModal}
                onClose={() => setShowServiceModal(false)}
                onSelectService={handleServiceTypeSelect}
            />

            <RegisterCarPackageModal
                t={t}
                isOpen={showPackageModal}
                onClose={() => setShowPackageModal(false)}
                onBack={() => {
                                    setShowPackageModal(false);
                                    setShowServiceModal(true);
                                }}
                onSelectDuration={handlePackageDurationSelect}
            />

            <ChapaPaymentModal
                t={t}
                isOpen={showPaymentFormModal}
                loading={loading}
                onClose={closePayment}
                title={t('valet.completePayment', { defaultValue: 'Complete Package Payment' })}
                totalAmount={packagePaymentAmount}
                phoneNumber={formData.phoneNumber}
                licensePlate={getFormLicenseDisplay(formData)}
                extraSummaryRows={packageTxRef ? [{
                    label: t('valet.paymentReference', { defaultValue: 'Reference' }),
                    value: packageTxRef,
                }] : []}
            />
        </div>
    );
};

export default RegisterCar;
