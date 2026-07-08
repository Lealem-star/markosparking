import React from 'react';
import { Edit2, Users } from 'lucide-react';
import { getStaffForParkingZone, formatSupervisorNames } from './pricingUtils';

const ParkingZoneListTable = ({
    t,
    zones,
    users = [],
    loading,
    onEdit,
    onToggleStatus,
    onViewValets,
}) => {
    if (zones.length === 0) {
        return (
            <div className="pricing-empty-message">
                <p>{t('settings.noParkingZones')}</p>
            </div>
        );
    }

    return (
        <div className="pricing-table-wrap pricing-zone-list-wrap">
            <table className="pricing-table pricing-zone-list-table">
                <thead>
                    <tr>
                        <th>{t('settings.zoneName')}</th>
                        <th>{t('settings.zoneLocation')}</th>
                        <th>{t('admin.status')}</th>
                        <th>{t('settings.supervisedBy')}</th>
                        <th>{t('settings.viewValets')}</th>
                        <th>{t('common.edit')}</th>
                    </tr>
                </thead>
                <tbody>
                    {zones.map((zone) => {
                        const isActive = zone.isActive !== false;
                        const { supervisors, valets } = getStaffForParkingZone(users, zone.code);
                        const supervisorLabel = formatSupervisorNames(supervisors, t);

                        return (
                            <tr key={zone._id || zone.code}>
                                <td className="pricing-zone-name-cell">{zone.name}</td>
                                <td>{zone.location}</td>
                                <td>
                                    <button
                                        type="button"
                                        className={`pricing-zone-status-toggle ${isActive ? 'is-active' : 'is-inactive'}`}
                                        onClick={() => onToggleStatus(zone)}
                                        disabled={loading}
                                        aria-label={isActive ? t('admin.active') : t('admin.inactive')}
                                    >
                                        {isActive ? t('admin.active') : t('admin.inactive')}
                                    </button>
                                </td>
                                <td className="pricing-zone-supervised-cell">{supervisorLabel}</td>
                                <td>
                                    <button
                                        type="button"
                                        className="pricing-level-action-btn pricing-level-action-btn--view"
                                        onClick={() => onViewValets(zone, valets)}
                                        disabled={loading}
                                    >
                                        <Users size={14} />
                                        {t('settings.viewValets')}
                                        {valets.length > 0 && ` (${valets.length})`}
                                    </button>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="pricing-level-action-btn pricing-level-action-btn--edit"
                                        onClick={() => onEdit(zone)}
                                        disabled={loading}
                                        aria-label={t('common.edit')}
                                    >
                                        <Edit2 size={14} />
                                        {t('common.edit')}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default ParkingZoneListTable;
