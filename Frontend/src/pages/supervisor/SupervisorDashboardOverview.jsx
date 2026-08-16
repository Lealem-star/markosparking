import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { UserCheck, UserX, ClipboardCheck, Sun, Sunset } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { useParkZonesQuery, useAttendanceSessionQuery } from '../../hooks/queries';
import { getApiError } from '../../api/client';
import { getStaffRoutePath } from '../../utils/rolePaths';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import SupervisorParkingOfficerTable from './SupervisorParkingOfficerTable';
import {
    attachZoneLabels,
    ATTENDANCE_SESSIONS,
    getTodayDateKey,
    partitionOfficersByAttendance,
} from './attendanceUtils';
import '../../styles/supervisorPortal.scss';

const SESSION_ICONS = {
    morning: Sun,
    afternoon: Sunset,
};

const SessionAttendancePanel = ({ sessionKey, session, parkZones, t }) => {
    const officersWithLabels = useMemo(
        () => attachZoneLabels(session),
        [session]
    );

    const { attended, absent, notMarked } = useMemo(
        () => partitionOfficersByAttendance(officersWithLabels),
        [officersWithLabels]
    );

    const Icon = SESSION_ICONS[sessionKey];

    return (
        <section className="supervisor-dashboard-session">
            <header className="supervisor-dashboard-session__header">
                <Icon size={18} />
                <h2>{t(`supervisor.attendanceSession.${sessionKey}`)}</h2>
                <span className="supervisor-dashboard-session__counts">
                    {t('supervisor.sessionAttendedCount', { count: attended.length })}
                    {' · '}
                    {t('supervisor.sessionAbsentCount', { count: absent.length })}
                </span>
            </header>

            {notMarked.length > 0 && (
                <p className="supervisor-attendance-note">
                    {t('supervisor.sessionNotMarkedNote', { count: notMarked.length })}
                </p>
            )}

            <div className="supervisor-panel-grid supervisor-panel-grid--compact">
                <section className="supervisor-panel">
                    <header className="supervisor-panel-header">
                        <UserCheck size={18} />
                        <h3>{t('supervisor.attendedToday')}</h3>
                        <span className="supervisor-panel-count">{attended.length}</span>
                    </header>
                    <SupervisorParkingOfficerTable
                        officers={attended}
                        parkZones={parkZones}
                        t={t}
                        emptyMessage={t('supervisor.noAttendedValets')}
                    />
                </section>

                <section className="supervisor-panel">
                    <header className="supervisor-panel-header">
                        <UserX size={18} />
                        <h3>{t('supervisor.absentToday')}</h3>
                        <span className="supervisor-panel-count">{absent.length}</span>
                    </header>
                    <SupervisorParkingOfficerTable
                        officers={absent}
                        parkZones={parkZones}
                        t={t}
                        emptyMessage={t('supervisor.noAbsentValets')}
                    />
                </section>
            </div>
        </section>
    );
};

const SupervisorDashboardOverview = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const dateKey = getTodayDateKey();
    const attendancePath = getStaffRoutePath(user?.type, 'attendance');

    const { data: parkZones = [] } = useParkZonesQuery(user?.token);
    const morningQuery = useAttendanceSessionQuery(user?.token, dateKey, 'morning');
    const afternoonQuery = useAttendanceSessionQuery(user?.token, dateKey, 'afternoon');

    const isLoading = morningQuery.isLoading || afternoonQuery.isLoading;
    const sessionError = morningQuery.error || afternoonQuery.error;

    const errorMessage = sessionError
        ? getApiError(sessionError, t('supervisor.attendanceLoadFailed'))
        : '';

    const sessionQueries = {
        morning: morningQuery.data,
        afternoon: afternoonQuery.data,
    };

    if (isLoading) {
        return <DashboardContentLoader />;
    }

    return (
        <div className="supervisor-portal">
            {errorMessage && (
                <div className="supervisor-alert supervisor-alert--error">{errorMessage}</div>
            )}

            <p className="supervisor-attendance-note supervisor-attendance-note--top">
                <Link to={attendancePath} className="supervisor-attendance-link">
                    <ClipboardCheck size={14} />
                    {t('supervisor.openAttendancePage')}
                </Link>
            </p>

            {ATTENDANCE_SESSIONS.map((sessionKey) => (
                <SessionAttendancePanel
                    key={sessionKey}
                    sessionKey={sessionKey}
                    session={sessionQueries[sessionKey]}
                    parkZones={parkZones}
                    t={t}
                />
            ))}
        </div>
    );
};

export default SupervisorDashboardOverview;
