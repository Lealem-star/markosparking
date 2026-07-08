import React from 'react';
import { X as XIcon } from 'lucide-react';

const EditParkingZoneModal = ({
    t,
    isOpen,
    zone,
    form,
    priceLevelNames = [],
    error,
    loading,
    onClose,
    onChange,
    onSubmit,
}) => {
    if (!isOpen || !zone) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{t('settings.editParkingZone')}</h2>
                        <p className="pricing-modal-subtitle">{zone.name} · {zone.code}</p>
                    </div>
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
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.zoneLocation')} *</label>
                        <input
                            type="text"
                            value={form.location}
                            onChange={(e) => onChange('location', e.target.value)}
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
                    </div>
                    <div className="form-group">
                        <label className="pricing-checkbox-label">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => onChange('isActive', e.target.checked)}
                            />
                            {t('admin.active')}
                        </label>
                    </div>
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

export default EditParkingZoneModal;
