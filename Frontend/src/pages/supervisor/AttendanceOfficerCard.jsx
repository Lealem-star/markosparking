import React from 'react';
import { getInitials } from '../admin/staffManagement/staffUtils';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { ATTENDANCE_STATUS, STATUS_BADGE_CLASS } from './attendanceUtils';

const AttendanceOfficerCard = ({ officer, t, onSelect, disabled }) => {
    const status = officer?.status || ATTENDANCE_STATUS.NOT_MARKED;
    const badgeClass = STATUS_BADGE_CLASS[status] || STATUS_BADGE_CLASS[ATTENDANCE_STATUS.NOT_MARKED];
    const photoUrl = resolveAssetUrl(officer?.profilePhoto);

    return (
        <button
            type="button"
            className="attendance-officer-card"
            onClick={() => onSelect(officer)}
            disabled={disabled}
        >
            <div className="attendance-officer-card__main">
                <span className="attendance-officer-card__avatar">
                    {photoUrl ? (
                        <img src={photoUrl} alt="" />
                    ) : (
                        getInitials(officer?.name)
                    )}
                </span>
                <div className="attendance-officer-card__info">
                    <strong>{officer?.name}</strong>
                    <span>{officer?.phoneNumber || '—'}</span>
                    <span>{officer?.zoneLabel || officer?.parkZoneCode || '—'}</span>
                </div>
            </div>
            <span className={`attendance-badge ${badgeClass}`}>
                {t(`supervisor.attendanceStatus.${status}`)}
            </span>
        </button>
    );
};

export default AttendanceOfficerCard;
