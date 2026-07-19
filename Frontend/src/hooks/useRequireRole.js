import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from './useAuth';
import { normalizeRole } from '../constants/roles';

export const useRequireRole = (allowedTypes, redirectTo = '/') => {
    const user = useCurrentUser();
    const navigate = useNavigate();
    const normalizedType = user?.type ? normalizeRole(user.type) : null;

    useEffect(() => {
        if (!user?.token) {
            navigate(redirectTo);
            return;
        }
        if (!normalizedType || !allowedTypes.includes(normalizedType)) {
            navigate(redirectTo);
        }
    }, [user, navigate, redirectTo, allowedTypes, normalizedType]);

    const isAuthorized =
        user?.token && normalizedType && allowedTypes.includes(normalizedType);

    return { user, isAuthorized };
};
