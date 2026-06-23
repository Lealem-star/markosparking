import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from './useAuth';

export const useRequireRole = (allowedTypes, redirectTo = '/') => {
    const user = useCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.token) {
            navigate(redirectTo);
            return;
        }
        if (!allowedTypes.includes(user.type)) {
            navigate(redirectTo);
        }
    }, [user, navigate, redirectTo, allowedTypes]);

    const isAuthorized =
        user?.token && allowedTypes.includes(user.type);

    return { user, isAuthorized };
};
