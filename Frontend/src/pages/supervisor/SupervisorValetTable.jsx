import React from 'react';
import { getInitials } from '../admin/staffManagement/staffUtils';
import { getValetZoneLabel } from './supervisorUtils';

const SupervisorValetTable = ({ valets = [], parkZones = [], t, emptyMessage }) => {
    if (valets.length === 0) {
        return (
            <div className="supervisor-empty-message">
                <em>{emptyMessage}</em>
            </div>
        );
    }

    return (
        <div className="supervisor-table-wrap">
            <table className="supervisor-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{t('profile.name')}</th>
                        <th>{t('auth.phoneNumber')}</th>
                        <th>{t('admin.parkZoneCode')}</th>
                    </tr>
                </thead>
                <tbody>
                    {valets.map((valet, index) => (
                        <tr key={valet._id || index}>
                            <td>{index + 1}</td>
                            <td>
                                <div className="supervisor-name-cell">
                                    <span className="supervisor-avatar">{getInitials(valet?.name)}</span>
                                    <strong>{valet?.name}</strong>
                                </div>
                            </td>
                            <td>{valet?.phoneNumber || '—'}</td>
                            <td>{getValetZoneLabel(valet, parkZones, t)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SupervisorValetTable;
