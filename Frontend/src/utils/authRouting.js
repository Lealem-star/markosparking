import { isStaffShellRole, isValetRole } from '../constants/roles';
import { getStaffRoutePath } from './rolePaths';

export const getDashboardPathForUser = (user) => {
    if (!user?.token) return '/';
    if (isStaffShellRole(user.type) || isValetRole(user.type)) {
        return getStaffRoutePath(user.type, 'dashboard');
    }
    return '/';
};
