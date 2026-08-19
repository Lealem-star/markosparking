import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, DollarSign, Users } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { getReportTabsForRole } from '../../config/staffAccess';
import FinancialReports from './reports/FinancialReports';
import CustomerReports from './reports/CustomerReports';
import AdministrativeReports from './reports/AdministrativeReports';
import '../../styles/reports.scss';

const ALL_TABS = [
    { id: 'financial', labelKey: 'reports.financialReports', icon: DollarSign, component: FinancialReports },
    { id: 'customer', labelKey: 'reports.customerReports', icon: Users, component: CustomerReports },
    { id: 'administrative', labelKey: 'reports.administrativeReports', icon: FileText, component: AdministrativeReports },
];

const Reports = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const allowedTabIds = useMemo(() => getReportTabsForRole(user?.type), [user?.type]);
    const tabs = useMemo(
        () => ALL_TABS.filter((tab) => allowedTabIds.includes(tab.id)),
        [allowedTabIds]
    );
    const [activeTab, setActiveTab] = useState(() => tabs[0]?.id || 'financial');

    useEffect(() => {
        if (tabs.length > 0 && !tabs.some((tab) => tab.id === activeTab)) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab]);

    const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component || FinancialReports;

    if (!user || tabs.length === 0) {
        return (
            <div className="reports-container">
                <div className="access-denied">
                    <h2>{t('reports.accessDenied')}</h2>
                    <p>{t('reports.noPermission')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="reports-container">
            <div className="reports-tabs">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={20} />
                            <span>{t(tab.labelKey)}</span>
                        </button>
                    );
                })}
            </div>

            <div className="reports-content">
                <ActiveComponent />
            </div>
        </div>
    );
};

export default Reports;
