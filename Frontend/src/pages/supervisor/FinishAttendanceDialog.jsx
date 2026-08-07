import React from 'react';
import ModalShell from '../../components/ui/ModalShell';

const FinishAttendanceDialog = ({
    isOpen,
    onClose,
    remainingCount,
    onMarkRemainingAbsent,
    onContinueEditing,
    t,
    isSaving,
}) => (
    <ModalShell
        isOpen={isOpen}
        onClose={onClose}
        title={t('supervisor.finishAttendanceTitle')}
        maxWidth="480px"
        footer={(
            <div className="attendance-finish-actions">
                <button
                    type="button"
                    className="attendance-btn attendance-btn--danger"
                    onClick={onMarkRemainingAbsent}
                    disabled={isSaving}
                >
                    {t('supervisor.markRemainingAbsent')}
                </button>
                <button
                    type="button"
                    className="attendance-btn attendance-btn--secondary"
                    onClick={onContinueEditing}
                    disabled={isSaving}
                >
                    {t('supervisor.continueEditing')}
                </button>
                <button
                    type="button"
                    className="attendance-btn attendance-btn--ghost"
                    onClick={onClose}
                    disabled={isSaving}
                >
                    {t('common.cancel')}
                </button>
            </div>
        )}
    >
        <p className="attendance-finish-message">
            {t('supervisor.finishAttendanceMessage', { count: remainingCount })}
        </p>
    </ModalShell>
);

export default FinishAttendanceDialog;
