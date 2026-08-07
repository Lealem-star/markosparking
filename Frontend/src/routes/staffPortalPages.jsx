import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { getDashboardPathForUser } from '../utils/authRouting';
import { hasStaffPermission } from '../config/staffAccess';
import { getStaffRoutePath } from '../utils/rolePaths';
import { ROLES, normalizeRole } from '../constants/roles';
import DashboardOverview from '../pages/admin/DashboardOverview';
import UserManagement from '../pages/admin/UserManagement';
import SupervisorDashboardOverview from '../pages/supervisor/SupervisorDashboardOverview';
import SupervisorValetList from '../pages/supervisor/SupervisorValetList';
import SupervisorAttendance from '../pages/supervisor/SupervisorAttendance';
import SupervisorIncidents from '../pages/supervisor/SupervisorIncidents';
import AuditLogs from '../pages/admin/AuditLogs';

const isSupervisor = (user) => normalizeRole(user?.type) === ROLES.SUPERVISOR;

export function StaffDashboardPage() {
    const user = useCurrentUser();
    if (isSupervisor(user)) return <SupervisorDashboardOverview />;
    return <DashboardOverview />;
}

export function StaffUsersPage() {
    const user = useCurrentUser();

    if (!user?.token) return <Navigate to="/" replace />;

    if (isSupervisor(user)) {
        return <Navigate to={getStaffRoutePath(user.type, 'valets')} replace />;
    }

    if (!hasStaffPermission(user.type, 'users')) {
        return <Navigate to={getDashboardPathForUser(user)} replace />;
    }

    return <UserManagement />;
}

export function StaffValetsPage() {
    return <SupervisorValetList />;
}

export function StaffAttendancePage() {
    return <SupervisorAttendance />;
}

export function StaffIncidentsPage() {
    return <SupervisorIncidents />;
}

export function StaffAuditLogsPage() {
    return <AuditLogs />;
}
