import React from 'react';
import { getInitials } from '../admin/staffManagement/staffUtils';
import { getParkingOfficerZoneLabel } from './supervisorUtils';

const SupervisorParkingOfficerTable = ({ officers = [], parkZones = [], t, emptyMessage }) => {
    if (officers.length === 0) {
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
                    {officers.map((officer, index) => (
                        <tr key={officer._id || index}>
                            <td>{index + 1}</td>
                            <td>
                                <div className="supervisor-name-cell">
                                    <span className="supervisor-avatar">{getInitials(officer?.name)}</span>
                                    <strong>{officer?.name}</strong>
                                </div>
                            </td>
                            <td>{officer?.phoneNumber || '—'}</td>
                            <td>{getParkingOfficerZoneLabel(officer, parkZones, t)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SupervisorParkingOfficerTable;
