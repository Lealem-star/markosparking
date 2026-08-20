import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { getDashboardPathForUser } from '../utils/authRouting';
import { hasStaffPermission } from '../config/staffAccess';
import { getStaffRoutePath } from '../utils/rolePaths';
import { ROLES, normalizeRole } from '../constants/roles';
import DashboardContentLoader from '../components/loading/DashboardContentLoader';

const DashboardOverview = lazy(() => import('../pages/admin/DashboardOverview'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const SupervisorDashboardOverview = lazy(() => import('../pages/supervisor/SupervisorDashboardOverview'));
const SupervisorParkingOfficerList = lazy(() => import('../pages/supervisor/SupervisorParkingOfficerList'));
const SupervisorAttendance = lazy(() => import('../pages/supervisor/SupervisorAttendance'));
const SupervisorIncidents = lazy(() => import('../pages/supervisor/SupervisorIncidents'));
const IncidentReports = lazy(() => import('../pages/admin/reports/IncidentReports'));
const AttendanceReports = lazy(() => import('../pages/admin/reports/AttendanceReports'));
const AuditLogs = lazy(() => import('../pages/admin/AuditLogs'));
const FinanceDashboardOverview = lazy(() => import('../pages/finance/FinanceDashboardOverview'));
const FinanceTransactions = lazy(() => import('../pages/finance/FinanceTransactions'));
const FinanceAuditLogs = lazy(() => import('../pages/finance/FinanceAuditLogs'));

const withPageSuspense = (element) => (
    <Suspense fallback={<DashboardContentLoader />}>
        {element}
    </Suspense>
);

const isSupervisor = (user) => normalizeRole(user?.type) === ROLES.SUPERVISOR;
const isFinanceOfficer = (user) => normalizeRole(user?.type) === ROLES.FINANCE_OFFICER;

export function StaffDashboardPage() {
    const user = useCurrentUser();
    if (isSupervisor(user)) return withPageSuspense(<SupervisorDashboardOverview />);
    if (isFinanceOfficer(user)) return withPageSuspense(<FinanceDashboardOverview />);
    return withPageSuspense(<DashboardOverview />);
}

export function StaffUsersPage() {
    const user = useCurrentUser();

    if (!user?.token) return <Navigate to="/" replace />;

    if (isSupervisor(user)) {
        return <Navigate to={getStaffRoutePath(user.type, 'parking-officers')} replace />;
    }

    if (!hasStaffPermission(user.type, 'users')) {
        return <Navigate to={getDashboardPathForUser(user)} replace />;
    }

    return withPageSuspense(<UserManagement />);
}

export function StaffParkingOfficersPage() {
    return withPageSuspense(<SupervisorParkingOfficerList />);
}

/** @deprecated use StaffParkingOfficersPage */
export const StaffValetsPage = StaffParkingOfficersPage;

export function StaffAttendancePage() {
    return withPageSuspense(<SupervisorAttendance />);
}

export function StaffIncidentsPage() {
    return withPageSuspense(<SupervisorIncidents />);
}

export function StaffIncidentReportsPage() {
    return withPageSuspense(<IncidentReports />);
}

export function StaffAttendanceReportsPage() {
    return withPageSuspense(<AttendanceReports />);
}

export function StaffAuditLogsPage() {
    return withPageSuspense(<AuditLogs />);
}

export function StaffTransactionsPage() {
    return withPageSuspense(<FinanceTransactions />);
}

export function StaffFinanceAuditLogsPage() {
    return withPageSuspense(<FinanceAuditLogs />);
}
