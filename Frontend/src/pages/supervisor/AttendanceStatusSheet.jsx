import React from 'react';
import { X } from 'lucide-react';
import { MARKABLE_ATTENDANCE_STATUSES, ATTENDANCE_STATUS } from './attendanceUtils';

const AttendanceStatusSheet = ({
    officer,
    isOpen,
    onClose,
    onSelectStatus,
    isSaving,
    t,
}) => {
    if (!isOpen || !officer) return null;

    const currentStatus = officer.status || ATTENDANCE_STATUS.NOT_MARKED;

    return (
        <div className="attendance-sheet-overlay" onClick={onClose} role="presentation">
            <div
                className="attendance-sheet"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('supervisor.attendanceMarkTitle')}
            >
                <div className="attendance-sheet__handle" aria-hidden="true" />
                <div className="attendance-sheet__header">
                    <div>
                        <h3>{officer.name}</h3>
                        <p>{officer.zoneLabel || officer.parkZoneCode}</p>
                    </div>
                    <button type="button" className="attendance-sheet__close" onClick={onClose} aria-label={t('common.close')}>
                        <X size={20} />
                    </button>
                </div>

                <div className="attendance-sheet__options">
                    {MARKABLE_ATTENDANCE_STATUSES.map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={`attendance-sheet__option attendance-sheet__option--${status}${currentStatus === status ? ' is-active' : ''}`}
                            onClick={() => onSelectStatus(status)}
                            disabled={isSaving}
                        >
                            {t(`supervisor.attendanceStatus.${status}`)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AttendanceStatusSheet;
