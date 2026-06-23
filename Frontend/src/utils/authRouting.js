import { isAdminRole, isValetRole } from '../constants/roles';

export const getDashboardPathForUser = (user) => {
    if (!user?.token) return '/';
    if (isAdminRole(user.type)) return '/admin/dashboard';
    if (isValetRole(user.type)) return '/valet/dashboard';
    return '/';
};
