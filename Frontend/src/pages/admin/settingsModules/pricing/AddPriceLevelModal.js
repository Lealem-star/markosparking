import React from 'react';
import { X as XIcon } from 'lucide-react';
import { CAR_TYPES } from './pricingUtils';

const emptyPricing = () =>
    CAR_TYPES.reduce((acc, type) => {
        acc[type] = { hourly: '', weekly: '', monthly: '', yearly: '' };
        return acc;
    }, {});

const AddPriceLevelModal = ({
    t,
    isOpen,
    name,
    pricing,
    error,
    loading,
    onClose,
    onNameChange,
    onPricingChange,
    onSubmit,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('settings.addPriceLevel')}</h2>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="form-group">
                        <label>{t('settings.priceLevelName')}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder={t('settings.priceLevelNamePlaceholder')}
                        />
                    </div>
                    <h4 className="pricing-modal-subtitle">{t('settings.pricingForEachCarType')}</h4>
                    {CAR_TYPES.map((carType) => (
                        <div key={carType} className="pricing-modal-car-block">
                            <h5>{t(`valet.carType_${carType}`)}</h5>
                            <div className="pricing-modal-grid">
                                {['hourly', 'weekly', 'monthly', 'yearly'].map((field) => (
                                    <div key={field} className="form-group">
                                        <label>{t(`settings.${field}`)}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={pricing[carType][field]}
                                            onChange={(e) => onPricingChange(carType, field, e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                    <button type="button" className="btn-submit" onClick={onSubmit} disabled={loading}>
                        {loading ? t('common.loading') : t('settings.addPriceLevel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export { emptyPricing };
export default AddPriceLevelModal;
