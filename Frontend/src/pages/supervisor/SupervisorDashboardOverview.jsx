import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
    UserCheck,
    UserX,
    AlertTriangle,
    Users,
    Flag,
} from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import {
    useAttendanceSessionQuery,
    useUsersQuery,
    useIncidentsQuery,
    useFlaggedCarsQuery,
} from '../../hooks/queries';
import { getApiError } from '../../api/client';
import { getStaffRoutePath } from '../../utils/rolePaths';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import { getSupervisorParkingOfficers } from './supervisorUtils';
import {
    attachZoneLabels,
    getTodayDateKey,
    isOnEthiopiaDate,
    summarizeDailyAttendance,
} from './attendanceUtils';
import '../../styles/supervisorPortal.scss';

const SupervisorDashboardOverview = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const dateKey = getTodayDateKey();
    const attendancePath = getStaffRoutePath(user?.type, 'attendance');
    const incidentsPath = getStaffRoutePath(user?.type, 'incidents');
    const officersPath = getStaffRoutePath(user?.type, 'parking-officers');
    const flaggedPath = getStaffRoutePath(user?.type, 'flagged-customers');

    const { data: users = [] } = useUsersQuery(user?.token);
    const { data: incidentData } = useIncidentsQuery(user?.token);
    const { data: flaggedCars = [] } = useFlaggedCarsQuery(user?.token);
    const morningQuery = useAttendanceSessionQuery(user?.token, dateKey, 'morning');
    const afternoonQuery = useAttendanceSessionQuery(user?.token, dateKey, 'afternoon');

    const isLoading = morningQuery.isLoading || afternoonQuery.isLoading;
    const sessionError = morningQuery.error || afternoonQuery.error;

    const errorMessage = sessionError
        ? getApiError(sessionError, t('supervisor.attendanceLoadFailed'))
        : '';

    const assignedOfficers = useMemo(() => {
        const fromUsers = getSupervisorParkingOfficers(users, user);
        if (fromUsers.length > 0) return fromUsers;

        const sessionOfficers = [
            ...attachZoneLabels(morningQuery.data),
            ...attachZoneLabels(afternoonQuery.data),
        ];
        const unique = new Map();
        sessionOfficers.forEach((officer) => {
            if (officer?._id && !unique.has(String(officer._id))) {
                unique.set(String(officer._id), officer);
            }
        });
        return [...unique.values()];
    }, [afternoonQuery.data, morningQuery.data, user, users]);

    const dailyAttendance = useMemo(() => {
        const morningOfficers = attachZoneLabels(morningQuery.data);
        const afternoonOfficers = attachZoneLabels(afternoonQuery.data);
        return summarizeDailyAttendance(morningOfficers, afternoonOfficers);
    }, [afternoonQuery.data, morningQuery.data]);

    const dailyIncidentCount = useMemo(
        () => (incidentData?.incidents || []).filter((incident) =>
            isOnEthiopiaDate(incident.createdAt, dateKey)
        ).length,
        [dateKey, incidentData?.incidents]
    );

    const dailyFlaggedCount = useMemo(
        () => flaggedCars.filter((car) =>
            isOnEthiopiaDate(car.flaggedAt || car.checkedOutAt, dateKey)
        ).length,
        [dateKey, flaggedCars]
    );

    if (isLoading) {
        return <DashboardContentLoader />;
    }

    return (
        <div className="supervisor-portal">
            {errorMessage && (
                <div className="supervisor-alert supervisor-alert--error">{errorMessage}</div>
            )}

            <div className="supervisor-stats-grid">
                <Link to={attendancePath} className="supervisor-stat-card supervisor-stat-card--attended">
                    <div className="supervisor-stat-icon">
                        <UserCheck size={22} />
                    </div>
                    <div>
                        <div className="supervisor-stat-value">{dailyAttendance.present}</div>
                        <div className="supervisor-stat-label">{t('supervisor.presentToday')}</div>
                    </div>
                </Link>
                <Link to={attendancePath} className="supervisor-stat-card supervisor-stat-card--absent">
                    <div className="supervisor-stat-icon">
                        <UserX size={22} />
                    </div>
                    <div>
                        <div className="supervisor-stat-value">{dailyAttendance.absent}</div>
                        <div className="supervisor-stat-label">{t('supervisor.absentToday')}</div>
                    </div>
                </Link>
                <Link to={incidentsPath} className="supervisor-stat-card supervisor-stat-card--incidents">
                    <div className="supervisor-stat-icon">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <div className="supervisor-stat-value">{dailyIncidentCount}</div>
                        <div className="supervisor-stat-label">{t('supervisor.incidentsToday')}</div>
                    </div>
                </Link>
                <Link to={officersPath} className="supervisor-stat-card supervisor-stat-card--officers">
                    <div className="supervisor-stat-icon">
                        <Users size={22} />
                    </div>
                    <div>
                        <div className="supervisor-stat-value">{assignedOfficers.length}</div>
                        <div className="supervisor-stat-label">{t('supervisor.officersInZone')}</div>
                    </div>
                </Link>
                <Link to={flaggedPath} className="supervisor-stat-card supervisor-stat-card--flagged">
                    <div className="supervisor-stat-icon">
                        <Flag size={22} />
                    </div>
                    <div>
                        <div className="supervisor-stat-value">{dailyFlaggedCount}</div>
                        <div className="supervisor-stat-label">{t('supervisor.flaggedToday')}</div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default SupervisorDashboardOverview;
