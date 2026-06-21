import React from 'react';
import { X } from 'lucide-react';
import { getLicensePlate } from './flaggedUtils';

const FlaggedPaymentModal = ({
    t,
    isOpen,
    selectedCar,
    feeDetails,
    loading,
    onClose,
}) => {
    if (!isOpen || !selectedCar || !feeDetails) return null;

    return (
        <div className="payment-modal-overlay" onClick={onClose}>
            <div className="payment-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('valet.completePayment')}</h2>
                    <button type="button" className="close-btn" onClick={onClose} disabled={loading}>
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
                            <span className="value">{getLicensePlate(selectedCar)}</span>
                        </div>
                    </div>

                    <div className="chapa-payment-form-section">
                        <h3>{t('valet.payOnline')}</h3>
                        <div id="chapa-inline-form" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlaggedPaymentModal;
