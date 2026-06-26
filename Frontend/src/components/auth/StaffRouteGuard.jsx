import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuth';
import { hasStaffPermission } from '../../config/staffAccess';

export function StaffRouteGuard({ permission, children }) {
    const user = useCurrentUser();

    if (!user?.token) {
        return <Navigate to="/" replace />;
    }

    if (!hasStaffPermission(user.type, permission)) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
}

export default StaffRouteGuard;
