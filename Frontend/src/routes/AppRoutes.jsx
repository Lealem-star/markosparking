import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { getDashboardPathForUser } from '../utils/authRouting';
import { hasStaffPermission } from '../config/staffAccess';
import { getStaffRoutePath } from '../utils/rolePaths';
import Home from '../pages/shared/Home';

export function LegacyStaffRedirect() {
    const user = useCurrentUser();
    const location = useLocation();

    if (!user?.token) return <Navigate to="/" replace />;

    const suffix = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard';
    return <Navigate to={getStaffRoutePath(user.type, suffix)} replace />;
}

export function LegacyUsersRedirect() {
    const user = useCurrentUser();

    if (!user?.token) return <Navigate to="/" replace />;

    if (hasStaffPermission(user.type, 'users')) {
        return <Navigate to={getStaffRoutePath(user.type, 'users')} replace />;
    }

    return <Navigate to={getDashboardPathForUser(user)} replace />;
}

export function LegacyPaymentRedirect() {
    const user = useCurrentUser();
    if (!user?.token) return <Navigate to="/" replace />;
    return <Navigate to={getDashboardPathForUser(user)} replace />;
}

export function PublicRoute({ children }) {
    const user = useCurrentUser();

    if (user?.token) {
        return <Navigate to={getDashboardPathForUser(user)} replace />;
    }

    return children;
}

export function RootRedirect() {
    const user = useCurrentUser();

    if (user?.token) {
        return <Navigate to={getDashboardPathForUser(user)} replace />;
    }

    return <Home />;
}
