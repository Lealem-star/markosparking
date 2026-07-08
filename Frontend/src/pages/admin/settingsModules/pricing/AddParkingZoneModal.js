import React from 'react';
import { X as XIcon } from 'lucide-react';

export const emptyParkZoneForm = () => ({
    name: '',
    location: '',
    priceLevel: '',
});

const AddParkingZoneModal = ({
    t,
    isOpen,
    form,
    priceLevelNames = [],
    error,
    loading,
    onClose,
    onChange,
    onSubmit,
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('settings.addParkingZone')}</h2>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="form-group">
                        <label>{t('settings.zoneName')} *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => onChange('name', e.target.value)}
                            placeholder={t('settings.zoneNamePlaceholder')}
                        />
                        <small>{t('settings.zoneCodeAutoHint')}</small>
                    </div>
                    <div className="form-group">
                        <label>{t('settings.zoneLocation')} *</label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => onChange('location', e.target.value)}
                            placeholder={t('settings.zoneLocationPlaceholder')}
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.priceLevelName')} *</label>
                        <select
                            value={form.priceLevel}
                            onChange={(e) => onChange('priceLevel', e.target.value)}
                            required
                        >
                            <option value="">{t('settings.selectPriceLevel')}</option>
                            {priceLevelNames.map((levelName) => (
                                <option key={levelName} value={levelName}>{levelName}</option>
                            ))}
                        </select>
                        {priceLevelNames.length === 0 && (
                            <small className="form-warning">{t('settings.noPriceLevelsForZone')}</small>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>{t('common.cancel')}</button>
                    <button
                        type="button"
                        className="btn-submit"
                        onClick={onSubmit}
                        disabled={loading || priceLevelNames.length === 0}
                    >
                        {loading ? t('common.loading') : t('settings.addParkingZone')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddParkingZoneModal;
