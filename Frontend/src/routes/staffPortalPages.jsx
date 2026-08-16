import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { getDashboardPathForUser } from '../utils/authRouting';
import { hasStaffPermission } from '../config/staffAccess';
import { getStaffRoutePath } from '../utils/rolePaths';
import { ROLES, normalizeRole } from '../constants/roles';
import DashboardOverview from '../pages/admin/DashboardOverview';
import UserManagement from '../pages/admin/UserManagement';
import SupervisorDashboardOverview from '../pages/supervisor/SupervisorDashboardOverview';
import SupervisorParkingOfficerList from '../pages/supervisor/SupervisorParkingOfficerList';
import SupervisorAttendance from '../pages/supervisor/SupervisorAttendance';
import SupervisorIncidents from '../pages/supervisor/SupervisorIncidents';
import AuditLogs from '../pages/admin/AuditLogs';
import FinanceDashboardOverview from '../pages/finance/FinanceDashboardOverview';
import FinanceTransactions from '../pages/finance/FinanceTransactions';
import FinanceAuditLogs from '../pages/finance/FinanceAuditLogs';

const isSupervisor = (user) => normalizeRole(user?.type) === ROLES.SUPERVISOR;
const isFinanceOfficer = (user) => normalizeRole(user?.type) === ROLES.FINANCE_OFFICER;

export function StaffDashboardPage() {
    const user = useCurrentUser();
    if (isSupervisor(user)) return <SupervisorDashboardOverview />;
    if (isFinanceOfficer(user)) return <FinanceDashboardOverview />;
    return <DashboardOverview />;
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

    return <UserManagement />;
}

export function StaffParkingOfficersPage() {
    return <SupervisorParkingOfficerList />;
}

/** @deprecated use StaffParkingOfficersPage */
export const StaffValetsPage = StaffParkingOfficersPage;

export function StaffAttendancePage() {
    return <SupervisorAttendance />;
}

export function StaffIncidentsPage() {
    return <SupervisorIncidents />;
}

export function StaffAuditLogsPage() {
    return <AuditLogs />;
}

export function StaffTransactionsPage() {
    return <FinanceTransactions />;
}

export function StaffFinanceAuditLogsPage() {
    return <FinanceAuditLogs />;
}
