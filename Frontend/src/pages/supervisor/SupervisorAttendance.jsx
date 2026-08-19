import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, CalendarDays, MapPin, CheckCircle2, Sun, Sunset } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import {
    useAttendanceSessionQuery,
    useFinishAttendanceMutation,
    useUpdateAttendanceStatusMutation,
} from '../../hooks/queries';
import { getApiError } from '../../api/client';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import AttendanceOfficerCard from './AttendanceOfficerCard';
import AttendanceStatusSheet from './AttendanceStatusSheet';
import FinishAttendanceDialog from './FinishAttendanceDialog';
import {
    attachZoneLabels,
    ATTENDANCE_SESSIONS,
    DEFAULT_ATTENDANCE_SESSION,
    filterAttendanceOfficers,
    formatDisplayDate,
    getTodayDateKey,
    groupOfficersByZone,
    getZoneMetaFromSession,
    STATUS_FILTER_OPTIONS,
} from './attendanceUtils';
import '../../styles/supervisorAttendance.scss';

const SESSION_ICONS = {
    morning: Sun,
    afternoon: Sunset,
};

const SupervisorAttendance = ({ reportMode = false }) => {
    const { t, i18n } = useTranslation();
    const user = useCurrentUser();
    const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
    const dateKey = reportMode ? selectedDate : getTodayDateKey();

    const [attendanceSession, setAttendanceSession] = useState(DEFAULT_ATTENDANCE_SESSION);
    const [searchQuery, setSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [showFinishDialog, setShowFinishDialog] = useState(false);
    const [actionError, setActionError] = useState('');

    const {
        data: session,
        isLoading,
        error: loadError,
    } = useAttendanceSessionQuery(user?.token, dateKey, attendanceSession);

    const updateStatusMutation = useUpdateAttendanceStatusMutation(
        user?.token,
        dateKey,
        attendanceSession
    );
    const finishMutation = useFinishAttendanceMutation(user?.token, dateKey, attendanceSession);

    useEffect(() => {
        setSearchQuery('');
        setZoneFilter('all');
        setStatusFilter('all');
        setSelectedOfficer(null);
        setShowFinishDialog(false);
        setActionError('');
    }, [attendanceSession]);

    const officersWithLabels = useMemo(
        () => attachZoneLabels(session),
        [session]
    );

    const filteredOfficers = useMemo(
        () => filterAttendanceOfficers(officersWithLabels, { searchQuery, zoneFilter, statusFilter }),
        [officersWithLabels, searchQuery, zoneFilter, statusFilter]
    );

    const filteredGroups = useMemo(
        () => groupOfficersByZone(filteredOfficers, getZoneMetaFromSession(session)),
        [filteredOfficers, session]
    );

    const assignedZoneSummary = useMemo(
        () => (session?.assignedZones || []).map((zone) => zone.label).join(', '),
        [session?.assignedZones]
    );

    const progress = session?.progress || { marked: 0, total: 0, percent: 0 };
    const stats = session?.stats || {};
    const canEdit = session?.canEdit !== false;
    const notMarkedCount = stats.notMarked || 0;

    const handleSelectStatus = async (status) => {
        if (!selectedOfficer || !canEdit) return;

        setActionError('');
        try {
            await updateStatusMutation.mutateAsync({
                officerId: selectedOfficer._id,
                status,
            });
            setSelectedOfficer(null);
        } catch (error) {
            setActionError(getApiError(error, t('supervisor.attendanceUpdateFailed')));
        }
    };

    const handleFinishClick = () => {
        if (!canEdit) return;

        if (notMarkedCount > 0) {
            setShowFinishDialog(true);
            return;
        }

        setActionError('');
        finishMutation.mutate(false, {
            onError: (error) => {
                setActionError(getApiError(error, t('supervisor.finishAttendanceFailed')));
            },
        });
    };

    const handleMarkRemainingAbsent = async () => {
        setActionError('');
        try {
            await finishMutation.mutateAsync(true);
            setShowFinishDialog(false);
        } catch (error) {
            setActionError(getApiError(error, t('supervisor.finishAttendanceFailed')));
        }
    };

    if (isLoading) {
        return <DashboardContentLoader />;
    }

    const errorMessage = loadError
        ? getApiError(loadError, t('supervisor.attendanceLoadFailed'))
        : actionError;

    return (
        <div className={`supervisor-attendance${reportMode ? ' supervisor-attendance--report' : ''}`}>
            {errorMessage && (
                <div className="supervisor-alert supervisor-alert--error">{errorMessage}</div>
            )}

            <header className="supervisor-attendance__top">
                <div>
                    <h1>{t(reportMode ? 'reports.attendanceReports' : 'supervisor.attendanceTitle')}</h1>
                    <div className="supervisor-attendance__meta">
                        {reportMode ? (
                            <label className="supervisor-attendance__date-picker">
                                <CalendarDays size={16} />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(event) => setSelectedDate(event.target.value)}
                                />
                            </label>
                        ) : (
                            <span>
                                <CalendarDays size={16} />
                                {formatDisplayDate(session?.date || dateKey, i18n.language)}
                            </span>
                        )}
                        {assignedZoneSummary && (
                            <span>
                                <MapPin size={16} />
                                {reportMode ? t('reports.allZones') : assignedZoneSummary}
                            </span>
                        )}
                    </div>
                    {reportMode && (
                        <p className="supervisor-attendance__report-note">
                            {t('reports.attendanceReportsSubtitle')}
                        </p>
                    )}
                </div>

                <div className="supervisor-attendance__progress">
                    <div className="supervisor-attendance__progress-label">
                        <span>{t('supervisor.progressLabel')}</span>
                        <strong>
                            {t('supervisor.progressCount', {
                                marked: progress.marked,
                                total: progress.total,
                            })}
                        </strong>
                    </div>
                    <div className="supervisor-attendance__progress-bar" aria-hidden="true">
                        <span style={{ width: `${progress.percent}%` }} />
                    </div>
                    <small>{t('supervisor.progressPercent', { percent: progress.percent })}</small>
                </div>
            </header>

            <div className="supervisor-attendance__session-toggle" role="tablist" aria-label={t('supervisor.attendanceSessionLabel')}>
                {ATTENDANCE_SESSIONS.map((sessionKey) => {
                    const Icon = SESSION_ICONS[sessionKey];
                    const isActive = attendanceSession === sessionKey;
                    return (
                        <button
                            key={sessionKey}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`attendance-session-tab${isActive ? ' attendance-session-tab--active' : ''}`}
                            onClick={() => setAttendanceSession(sessionKey)}
                        >
                            <Icon size={18} />
                            {t(`supervisor.attendanceSession.${sessionKey}`)}
                        </button>
                    );
                })}
            </div>

            <div className="supervisor-attendance__filters">
                <label className="supervisor-search-field">
                    <Search size={18} />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t('supervisor.searchOfficersPlaceholder')}
                    />
                </label>

                {(session?.assignedZones || []).length > (reportMode ? 0 : 1) && (
                    <select
                        className="supervisor-zone-filter"
                        value={zoneFilter}
                        onChange={(event) => setZoneFilter(event.target.value)}
                    >
                        <option value="all">{t('supervisor.allAssignedZones')}</option>
                        {session.assignedZones.map((zone) => (
                            <option key={zone.code} value={zone.code}>
                                {zone.label}
                            </option>
                        ))}
                    </select>
                )}

                <select
                    className="supervisor-zone-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">{t('supervisor.allStatuses')}</option>
                    {STATUS_FILTER_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                            {t(`supervisor.attendanceStatus.${status}`)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="supervisor-attendance__list">
                {filteredGroups.length === 0 ? (
                    <div className="supervisor-empty-message">
                        <em>{t('supervisor.noOfficersForFilters')}</em>
                    </div>
                ) : (
                    filteredGroups.map((group) => (
                        <section key={group.code} className="attendance-zone-group">
                            <header className="attendance-zone-group__header">
                                <h2>{group.label || group.code}</h2>
                                <span>{group.officers.length}</span>
                            </header>
                            <div className="attendance-zone-group__cards">
                                {group.officers.map((officer) => (
                                    <AttendanceOfficerCard
                                        key={officer._id}
                                        officer={officer}
                                        t={t}
                                        disabled={reportMode || !canEdit || updateStatusMutation.isPending}
                                        onSelect={reportMode ? undefined : setSelectedOfficer}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>

            {!reportMode && canEdit && (
                <div className="supervisor-attendance__footer">
                    <button
                        type="button"
                        className="attendance-btn attendance-btn--primary"
                        onClick={handleFinishClick}
                        disabled={finishMutation.isPending}
                    >
                        <CheckCircle2 size={18} />
                        {t('supervisor.finishAttendance')}
                    </button>
                </div>
            )}

            {!reportMode && (
                <>
                    <AttendanceStatusSheet
                        officer={selectedOfficer}
                        isOpen={Boolean(selectedOfficer)}
                        onClose={() => setSelectedOfficer(null)}
                        onSelectStatus={handleSelectStatus}
                        isSaving={updateStatusMutation.isPending}
                        t={t}
                    />

                    <FinishAttendanceDialog
                        isOpen={showFinishDialog}
                        onClose={() => setShowFinishDialog(false)}
                        remainingCount={notMarkedCount}
                        onMarkRemainingAbsent={handleMarkRemainingAbsent}
                        onContinueEditing={() => setShowFinishDialog(false)}
                        t={t}
                        isSaving={finishMutation.isPending}
                    />
                </>
            )}
        </div>
    );
};

export default SupervisorAttendance;
