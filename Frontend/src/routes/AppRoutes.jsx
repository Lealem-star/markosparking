import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useAuth';
import { getDashboardPathForUser } from '../utils/authRouting';
import Home from '../pages/shared/Home';

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
