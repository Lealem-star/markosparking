import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuth';
import { hasStaffPermission } from '../../config/staffAccess';
import { getDashboardPathForUser } from '../../utils/authRouting';

export function StaffRouteGuard({ permission, children }) {
    const user = useCurrentUser();

    if (!user?.token) {
        return <Navigate to="/" replace />;
    }

    if (!hasStaffPermission(user.type, permission)) {
        return <Navigate to={getDashboardPathForUser(user)} replace />;
    }

    return children;
}

export default StaffRouteGuard;
