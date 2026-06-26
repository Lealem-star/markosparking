import {
    LayoutDashboard,
    Users,
    Settings,
    FileText,
    AlertTriangle,
} from 'lucide-react';
import {
    ROLES,
    REPORT_ROLES,
    canAccessStaffManagement,
    normalizeRole,
} from '../constants/roles';

export const STAFF_PERMISSIONS = Object.freeze({
    dashboard: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.SUPERVISOR, ROLES.FINANCE_OFFICER],
    users: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.SUPERVISOR],
    reports: REPORT_ROLES,
    settings: [ROLES.SYSTEM_ADMIN],
    flagged: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.SUPERVISOR, ROLES.FINANCE_OFFICER],
    chat: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.SUPERVISOR, ROLES.FINANCE_OFFICER],
});

export const REPORT_TAB_PERMISSIONS = Object.freeze({
    financial: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.FINANCE_OFFICER],
    customer: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.FINANCE_OFFICER],
    administrative: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR],
});

const MENU_DEFINITIONS = [
    {
        id: 'dashboard',
        icon: LayoutDashboard,
        labelKey: 'navigation.dashboard',
        path: '/admin/dashboard',
    },
    {
        id: 'users',
        icon: Users,
        labelKey: 'admin.userManagement',
        path: '/admin/users',
    },
    {
        id: 'reports',
        icon: FileText,
        labelKey: 'navigation.reports',
        path: '/admin/reports',
    },
    {
        id: 'settings',
        icon: Settings,
        labelKey: 'navigation.settings',
        path: '/admin/settings',
    },
    {
        id: 'flagged',
        icon: AlertTriangle,
        labelKey: 'valet.flaggedCustomers',
        path: '/admin/flagged-customers',
    },
];

export const hasStaffPermission = (userType, permission) => {
    const role = normalizeRole(userType);
    return (STAFF_PERMISSIONS[permission] || []).includes(role);
};

export const getMenuItemsForRole = (userType, t) => {
    const role = normalizeRole(userType);

    return MENU_DEFINITIONS
        .filter((item) => hasStaffPermission(role, item.id))
        .map((item) => ({
            icon: item.icon,
            label: t(item.labelKey),
            path: item.path,
        }));
};

export const getReportTabsForRole = (userType) => {
    const role = normalizeRole(userType);
    return Object.entries(REPORT_TAB_PERMISSIONS)
        .filter(([, roles]) => roles.includes(role))
        .map(([tabId]) => tabId);
};

export const getRoleLabelKey = (userType) => {
    switch (normalizeRole(userType)) {
        case ROLES.SYSTEM_ADMIN:
            return 'admin.systemAdmin';
        case ROLES.DIRECTOR:
            return 'admin.director';
        case ROLES.SUPERVISOR:
            return 'admin.supervisor';
        case ROLES.FINANCE_OFFICER:
            return 'admin.financeOfficer';
        default:
            return 'admin.unknownRole';
    }
};

export const getRoleSubtitleKey = (userType) => {
    switch (normalizeRole(userType)) {
        case ROLES.SYSTEM_ADMIN:
            return 'admin.systemAdminResponsibility';
        case ROLES.DIRECTOR:
            return 'admin.directorResponsibility';
        case ROLES.SUPERVISOR:
            return 'admin.supervisorResponsibility';
        case ROLES.FINANCE_OFFICER:
            return 'admin.financeOfficerResponsibility';
        default:
            return '';
    }
};

export const getStaffManagementMode = (userType) => {
    const role = normalizeRole(userType);
    if (role === ROLES.SUPERVISOR) return 'supervisor';
    if (canAccessStaffManagement(role)) return 'full';
    return 'none';
};
