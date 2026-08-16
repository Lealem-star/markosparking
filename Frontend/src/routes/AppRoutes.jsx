import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { getDashboardPathForUser } from '../utils/authRouting';
import { hasStaffPermission } from '../config/staffAccess';
import {
    getStaffRoutePath,
    LEGACY_ROLE_PATH_PREFIX,
    mapLegacyStaffSegment,
} from '../utils/rolePaths';
import { ROLES, normalizeRole } from '../constants/roles';
import Home from '../pages/shared/Home';

const mapLegacyStaffSuffix = (userType, suffix) => {
    const mapped = mapLegacyStaffSegment(suffix);
    if (normalizeRole(userType) === ROLES.SUPERVISOR && mapped === 'users') {
        return 'parking-officers';
    }
    return mapped;
};

export function LegacyStaffRedirect() {
    const user = useCurrentUser();
    const location = useLocation();

    if (!user?.token) return <Navigate to="/" replace />;

    const suffix = mapLegacyStaffSuffix(
        user.type,
        location.pathname.replace(/^\/admin\/?/, '') || 'dashboard'
    );
    return <Navigate to={getStaffRoutePath(user.type, suffix)} replace />;
}

export function LegacyPrefixRedirect() {
    const location = useLocation();
    const parts = location.pathname.split('/').filter(Boolean);
    const legacyPrefix = parts[0];
    const currentPrefix = LEGACY_ROLE_PATH_PREFIX[legacyPrefix];

    if (!currentPrefix) {
        return <Navigate to="/" replace />;
    }

    const suffix = mapLegacyStaffSegment(parts.slice(1).join('/') || 'dashboard');
    return <Navigate to={`/${currentPrefix}/${suffix}${location.search}${location.hash}`} replace />;
}

export function LegacyUsersRedirect() {
    const user = useCurrentUser();

    if (!user?.token) return <Navigate to="/" replace />;

    if (hasStaffPermission(user.type, 'users')) {
        return <Navigate to={getStaffRoutePath(user.type, 'users')} replace />;
    }

    if (hasStaffPermission(user.type, 'parkingOfficers')) {
        return <Navigate to={getStaffRoutePath(user.type, 'parking-officers')} replace />;
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
