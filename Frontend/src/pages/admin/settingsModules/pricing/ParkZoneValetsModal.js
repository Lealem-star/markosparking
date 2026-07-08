import React from 'react';
import { X as XIcon, Users } from 'lucide-react';

const ParkZoneValetsModal = ({
    t,
    isOpen,
    zone,
    valets = [],
    onClose,
}) => {
    if (!isOpen || !zone) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content pricing-modal park-zone-valets-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{t('settings.zoneValetsTitle')}</h2>
                        <p className="pricing-modal-subtitle">
                            {zone.name} · {zone.code}
                        </p>
                    </div>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    {valets.length === 0 ? (
                        <div className="pricing-empty-message">
                            <Users size={28} />
                            <p>{t('settings.noValetsInZone')}</p>
                        </div>
                    ) : (
                        <div className="pricing-table-wrap">
                            <table className="pricing-table park-zone-valets-table">
                                <thead>
                                    <tr>
                                        <th>{t('auth.name')}</th>
                                        <th>{t('auth.phoneNumber')}</th>
                                        <th>{t('admin.priceLevel')}</th>
                                        <th>{t('admin.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {valets.map((valet) => (
                                        <tr key={valet._id || valet.phoneNumber}>
                                            <td>{valet.name}</td>
                                            <td>{valet.phoneNumber || '—'}</td>
                                            <td>{valet.priceLevel || '—'}</td>
                                            <td>
                                                <span className={`pricing-zone-status ${valet.isActive !== false ? 'is-active' : 'is-inactive'}`}>
                                                    {valet.isActive !== false ? t('admin.active') : t('admin.inactive')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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

export default ParkZoneValetsModal;
