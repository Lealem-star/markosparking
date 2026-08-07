import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { useAuditLogsQuery } from '../../hooks/queries/useAuditLogsQuery';
import { useFinanceAuditLogsQuery } from '../../hooks/queries/useFinanceAuditLogsQuery';
import { getApiError } from '../../api/client';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import {
    AUDIT_ACTIONS,
    AUDIT_CATEGORIES,
    FINANCE_AUDIT_ACTIONS,
    FINANCE_AUDIT_CATEGORIES,
    formatAuditTimestamp,
    formatMetadataPreview,
} from './auditLogUtils';
import '../../styles/auditLogs.scss';

const PAGE_SIZE = 50;

const AuditLogs = ({ scope = 'full' }) => {
    const isFinanceScope = scope === 'finance';
    const { t, i18n } = useTranslation();
    const user = useCurrentUser();

    const categoryOptions = isFinanceScope ? FINANCE_AUDIT_CATEGORIES : AUDIT_CATEGORIES;
    const actionOptions = isFinanceScope ? FINANCE_AUDIT_ACTIONS : AUDIT_ACTIONS;

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState(null);

    const filters = useMemo(() => ({
        search: searchQuery.trim() || undefined,
        category: categoryFilter,
        action: actionFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: PAGE_SIZE,
    }), [searchQuery, categoryFilter, actionFilter, startDate, endDate, page]);

    const fullQuery = useAuditLogsQuery(user?.token, filters, { enabled: !isFinanceScope });
    const financeQuery = useFinanceAuditLogsQuery(user?.token, filters, { enabled: isFinanceScope });
    const { data, isLoading, error } = isFinanceScope ? financeQuery : fullQuery;

    const items = data?.items || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    const handleFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setPage(1);
    };

    if (isLoading && !data) {
        return <DashboardContentLoader />;
    }

    const errorMessage = error
        ? getApiError(error, t(isFinanceScope ? 'financeAuditLogs.loadFailed' : 'auditLogs.loadFailed'))
        : '';

    return (
        <div className="audit-logs-page">
            <header className="audit-logs-page__header">
                <div>
                    <h1>
                        <ScrollText size={24} />
                        {t(isFinanceScope ? 'financeAuditLogs.title' : 'auditLogs.title')}
                    </h1>
                    <p>{t(isFinanceScope ? 'financeAuditLogs.subtitle' : 'auditLogs.subtitle')}</p>
                </div>
                <span className="audit-logs-page__count">
                    {t('auditLogs.totalEntries', { count: total })}
                </span>
            </header>

            {errorMessage && (
                <div className="audit-logs-alert audit-logs-alert--error">{errorMessage}</div>
            )}

            <div className="audit-logs-filters">
                <label className="audit-logs-search">
                    <Search size={18} />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={handleFilterChange(setSearchQuery)}
                        placeholder={t('auditLogs.searchPlaceholder')}
                    />
                </label>

                <select value={categoryFilter} onChange={handleFilterChange(setCategoryFilter)}>
                    <option value="all">{t('auditLogs.allCategories')}</option>
                    {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                            {t(`auditLogs.categories.${category}`)}
                        </option>
                    ))}
                </select>

                <select value={actionFilter} onChange={handleFilterChange(setActionFilter)}>
                    <option value="all">{t('auditLogs.allActions')}</option>
                    {actionOptions.map((action) => (
                        <option key={action} value={action}>
                            {t(`auditLogs.actions.${action}`)}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={startDate}
                    onChange={handleFilterChange(setStartDate)}
                    aria-label={t('auditLogs.startDate')}
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={handleFilterChange(setEndDate)}
                    aria-label={t('auditLogs.endDate')}
                />
            </div>

            <div className="audit-logs-table-wrap">
                <table className="audit-logs-table">
                    <thead>
                        <tr>
                            <th>{t('auditLogs.time')}</th>
                            <th>{t('auditLogs.category')}</th>
                            <th>{t('auditLogs.action')}</th>
                            <th>{t('auditLogs.actor')}</th>
                            <th>{t('auditLogs.summary')}</th>
                            <th>{t('auditLogs.status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="audit-logs-empty">
                                    {t('auditLogs.noEntries')}
                                </td>
                            </tr>
                        ) : (
                            items.map((entry) => {
                                const rowId = entry._id;
                                const isExpanded = expandedId === rowId;
                                const metadataPreview = formatMetadataPreview(entry.metadata);

                                return (
                                    <React.Fragment key={rowId}>
                                        <tr
                                            className={isExpanded ? 'audit-logs-row--expanded' : ''}
                                            onClick={() => setExpandedId(isExpanded ? null : rowId)}
                                        >
                                            <td>{formatAuditTimestamp(entry.createdAt, i18n.language)}</td>
                                            <td>
                                                <span className={`audit-badge audit-badge--${entry.category}`}>
                                                    {t(`auditLogs.categories.${entry.category}`, entry.category)}
                                                </span>
                                            </td>
                                            <td>{t(`auditLogs.actions.${entry.action}`, entry.action)}</td>
                                            <td>
                                                <div className="audit-logs-actor">
                                                    <strong>{entry.actorName || '—'}</strong>
                                                    {entry.actorRole && (
                                                        <small>{t(`admin.${entry.actorRole}`, entry.actorRole)}</small>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{entry.summary}</td>
                                            <td>
                                                <span className={`audit-status audit-status--${entry.status}`}>
                                                    {t(`auditLogs.statuses.${entry.status}`, entry.status)}
                                                </span>
                                            </td>
                                        </tr>
                                        {isExpanded && metadataPreview && (
                                            <tr className="audit-logs-details-row">
                                                <td colSpan={6}>
                                                    <pre>{metadataPreview}</pre>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="audit-logs-pagination">
                    <button
                        type="button"
                        disabled={page <= 1 || isLoading}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        <ChevronLeft size={18} />
                        {t('auditLogs.previous')}
                    </button>
                    <span>{t('auditLogs.pageInfo', { page, totalPages })}</span>
                    <button
                        type="button"
                        disabled={page >= totalPages || isLoading}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                        {t('auditLogs.next')}
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
