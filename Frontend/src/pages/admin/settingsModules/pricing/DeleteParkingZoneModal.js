import React from 'react';
import { X as XIcon } from 'lucide-react';

const DeleteParkingZoneModal = ({
    t,
    isOpen,
    zone,
    loading,
    onCancel,
    onConfirm,
}) => {
    if (!isOpen || !zone) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content pricing-modal pricing-delete-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('settings.deleteParkingZone')}</h2>
                    <button type="button" className="modal-close" onClick={onCancel}>
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p>
                        {t('settings.deleteParkingZoneConfirm')} <strong>{zone.code}</strong> ({zone.name})?
                    </p>
                    <p className="pricing-delete-hint">{t('settings.cannotBeUndone')}</p>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onCancel}>{t('common.cancel')}</button>
                    <button type="button" className="btn-submit btn-danger" onClick={onConfirm} disabled={loading}>
                        {loading ? t('settings.deleting') : t('common.delete')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteParkingZoneModal;
