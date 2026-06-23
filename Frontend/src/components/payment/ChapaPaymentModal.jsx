import { X } from 'lucide-react';
import { CHAPA_INLINE_FORM_ID } from '../../utils/chapaInline';
import '../../styles/chapaPaymentModal.scss';

const ChapaPaymentModal = ({
    t,
    isOpen,
    loading,
    onClose,
    title,
    totalAmount,
    phoneNumber,
    licensePlate,
    extraSummaryRows = [],
}) => {
    if (!isOpen || totalAmount == null) return null;

    const resolvedTitle = title || t('valet.completePayment');
    const summaryRows = [
        {
            label: t('valet.totalAmount'),
            value: `${Number(totalAmount).toFixed(2)} ETB`,
        },
        {
            label: t('valet.phoneNumber'),
            value: phoneNumber || 'N/A',
        },
    ];

    if (licensePlate) {
        summaryRows.push({
            label: t('valet.licensePlate'),
            value: licensePlate,
        });
    }

    summaryRows.push(...extraSummaryRows);

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{resolvedTitle}</h2>
                    <button type="button" className="close-btn" onClick={onClose} disabled={loading}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-content">
                    <div className="payment-summary-section">
                        <h3>{t('valet.paymentSummary')}</h3>
                        {summaryRows.map((row) => (
                            <div key={row.label} className="summary-row">
                                <span className="label">{row.label}:</span>
                                <span className="value">{row.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="chapa-payment-form-section">
                        <h3>{t('valet.payOnline')}</h3>
                        <div id={CHAPA_INLINE_FORM_ID} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChapaPaymentModal;
