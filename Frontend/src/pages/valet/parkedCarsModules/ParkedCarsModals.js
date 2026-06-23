export const ParkedCarsStatusModal = ({ t, isOpen, newStatus, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{t('valet.changeStatus')}</h3>
                <p>{t('messages.confirmDelete')} <strong>{newStatus.replace('_', ' ')}</strong>?</p>
                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                    <button type="button" className="btn-confirm" onClick={onConfirm}>{t('common.confirm')}</button>
                </div>
            </div>
        </div>
    );
};

export const ParkedCarsCheckoutModal = ({
    t,
    isOpen,
    feeDetails,
    loading,
    onClose,
    onPayNow,
    onFlagHim,
}) => {
    if (!isOpen || !feeDetails) return null;

    return (
        <div className="checkout-modal-overlay" onClick={() => !loading && onClose()}>
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
                            <span className="value">{feeDetails.parkingFee.toFixed(2)} ETB</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">VAT:</span>
                            <span className="value">{feeDetails.vatAmount.toFixed(2)} ETB</span>
                        </div>
                        <div className="detail-row total-fee">
                            <span className="label">{t('common.total')}:</span>
                            <span className="value">{feeDetails.totalWithVat.toFixed(2)} ETB</span>
                        </div>
                    </div>
                    <div className="checkout-buttons-row">
                        <button type="button" className="btn-checkout-pay" onClick={onPayNow} disabled={loading}>
                            {t('valet.payNow')}
                        </button>
                        <button type="button" className="btn-checkout-flag" onClick={onFlagHim} disabled={loading}>
                            {loading ? t('common.loading') : t('valet.flagHim')}
                        </button>
                    </div>
                </div>
                <div className="checkout-modal-footer">
                    <button type="button" className="btn-checkout-cancel" onClick={() => !loading && onClose()} disabled={loading}>
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};
