import React from 'react';
import { X as XIcon } from 'lucide-react';
import { CAR_TYPES } from './pricingUtils';

const EditPriceLevelModal = ({
    t,
    isOpen,
    priceLevelName,
    pricing,
    error,
    loading,
    onClose,
    onPricingChange,
    onSubmit,
}) => {
    if (!isOpen || !priceLevelName) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{t('settings.editPriceLevel')}</h2>
                        <p className="pricing-modal-subtitle">{priceLevelName}</p>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {error && <div className="alert alert-danger">{error}</div>}
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
                                            value={pricing?.[carType]?.[field] ?? ''}
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
                        {loading ? t('common.loading') : t('settings.saveChanges')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditPriceLevelModal;
