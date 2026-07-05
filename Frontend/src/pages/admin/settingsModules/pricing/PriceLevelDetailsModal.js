import React from 'react';
import { X as XIcon } from 'lucide-react';
import PricingTable from './PricingTable';

const PriceLevelDetailsModal = ({
    t,
    isOpen,
    priceLevelName,
    pricing,
    onClose,
}) => {
    if (!isOpen || !priceLevelName) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pricing-modal pricing-details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{t('settings.priceLevelDetails')}</h2>
                        <p className="pricing-modal-subtitle">{priceLevelName}</p>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <PricingTable
                        t={t}
                        priceLevelName={priceLevelName}
                        pricing={pricing}
                        readOnly
                    />
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceLevelDetailsModal;
