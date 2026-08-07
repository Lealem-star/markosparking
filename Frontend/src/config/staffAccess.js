import {
    LayoutDashboard,
    Users,
    Settings,
    FileText,
    AlertTriangle,
    ClipboardCheck,
    ShieldAlert,
    ScrollText,
    Receipt,
    Banknote,
} from 'lucide-react';
import {
    ROLES,
    REPORT_ROLES,
    canAccessStaffManagement,
    normalizeRole,
} from '../constants/roles';
import { getStaffRoutePath } from '../utils/rolePaths';

export const STAFF_PERMISSIONS = Object.freeze({
    dashboard: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.SUPERVISOR, ROLES.FINANCE_OFFICER],
    users: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR],
    valets: [ROLES.SUPERVISOR],
    attendance: [ROLES.SUPERVISOR],
    incidents: [ROLES.SUPERVISOR],
    reports: REPORT_ROLES,
    settings: [ROLES.SYSTEM_ADMIN],
    auditLogs: [ROLES.SYSTEM_ADMIN],
    flagged: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.SUPERVISOR, ROLES.FINANCE_OFFICER],
    transactions: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.FINANCE_OFFICER],
    financeAuditLogs: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.FINANCE_OFFICER],
    reconciliations: [ROLES.SYSTEM_ADMIN, ROLES.DIRECTOR, ROLES.FINANCE_OFFICER],
    shiftClose: [ROLES.SUPERVISOR],
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
        segment: 'dashboard',
    },
    {
        id: 'users',
        icon: Users,
        labelKey: 'admin.userManagement',
        segment: 'users',
    },
    {
        id: 'reports',
        icon: FileText,
        labelKey: 'navigation.reports',
        segment: 'reports',
    },
    {
        id: 'transactions',
        icon: Receipt,
        labelKey: 'finance.transactionsTitle',
        segment: 'transactions',
    },
    {
        id: 'reconciliations',
        icon: Banknote,
        labelKey: 'reconciliation.reviewQueueTitle',
        segment: 'reconciliations',
    },
    {
        id: 'financeAuditLogs',
        icon: ScrollText,
        labelKey: 'financeAuditLogs.title',
        segment: 'finance-audit-logs',
    },
    {
        id: 'settings',
        icon: Settings,
        labelKey: 'navigation.settings',
        segment: 'settings',
    },
    {
        id: 'auditLogs',
        icon: ScrollText,
        labelKey: 'auditLogs.title',
        segment: 'audit-logs',
    },
    {
        id: 'flagged',
        icon: AlertTriangle,
        labelKey: 'valet.flaggedCustomers',
        segment: 'flagged-customers',
    },
];

export const hasStaffPermission = (userType, permission) => {
    const role = normalizeRole(userType);
    return (STAFF_PERMISSIONS[permission] || []).includes(role);
};

const SUPERVISOR_MENU_DEFINITIONS = [
    {
        id: 'dashboard',
        icon: LayoutDashboard,
        labelKey: 'navigation.dashboard',
        segment: 'dashboard',
    },
    {
        id: 'valets',
        icon: Users,
        labelKey: 'supervisor.valetList',
        segment: 'valets',
    },
    {
        id: 'attendance',
        icon: ClipboardCheck,
        labelKey: 'supervisor.attendance',
        segment: 'attendance',
    },
    {
        id: 'incidents',
        icon: ShieldAlert,
        labelKey: 'supervisor.incidents',
        segment: 'incidents',
    },
    {
        id: 'shiftClose',
        icon: Banknote,
        labelKey: 'reconciliation.shiftCloseTitle',
        segment: 'shift-close',
    },
    {
        id: 'flagged',
        icon: AlertTriangle,
        labelKey: 'valet.flaggedCustomers',
        segment: 'flagged-customers',
    },
];

export const getMenuItemsForRole = (userType, t) => {
    const role = normalizeRole(userType);
    const definitions = role === ROLES.SUPERVISOR ? SUPERVISOR_MENU_DEFINITIONS : MENU_DEFINITIONS;

    return definitions
        .filter((item) => hasStaffPermission(role, item.id))
        .map((item) => ({
            icon: item.icon,
            label: t(item.labelKey),
            path: getStaffRoutePath(userType, item.segment),
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
