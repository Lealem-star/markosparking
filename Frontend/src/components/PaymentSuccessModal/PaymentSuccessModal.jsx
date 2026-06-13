import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './styles.scss';

const PaymentSuccessModal = ({
    show,
    title,
    message,
    amount,
    onClose,
    autoCloseMs = 2500,
}) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (!show || !autoCloseMs || !onClose) return undefined;
        const timer = setTimeout(onClose, autoCloseMs);
        return () => clearTimeout(timer);
    }, [show, autoCloseMs, onClose]);

    if (!show) return null;

    return (
        <div className="payment-success-overlay" onClick={onClose} role="presentation">
            <div
                className="payment-success-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-success-title"
            >
                <div className="payment-success-icon">
                    <CheckCircle size={56} strokeWidth={1.75} />
                </div>
                <h2 id="payment-success-title">{title || t('valet.paymentSuccessTitle')}</h2>
                {message && <p className="payment-success-message">{message}</p>}
                {amount != null && (
                    <p className="payment-success-amount">
                        {Number(amount).toFixed(2)} ETB
                    </p>
                )}
                <button type="button" className="payment-success-btn" onClick={onClose}>
                    {t('valet.paymentSuccessContinue')}
                </button>
            </div>
        </div>
    );
};

export default PaymentSuccessModal;
