import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import {
    useParkZonesQuery,
    useReviewShiftReconciliationMutation,
    useShiftReconciliationsQuery,
} from '../../hooks/queries';
import { getApiError } from '../../api/client';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import { ATTENDANCE_SESSIONS } from '../supervisor/attendanceUtils';
import '../../styles/shiftReconciliation.scss';

const PAGE_SIZE = 50;
const STATUS_OPTIONS = ['all', 'submitted', 'approved', 'rejected'];

const ReviewModal = ({ t, item, loading, onClose, onSubmit }) => {
    const [reviewNote, setReviewNote] = useState('');

    if (!item) return null;

    return (
        <div className="shift-modal-overlay" role="presentation" onClick={onClose}>
            <div className="shift-modal" role="dialog" onClick={(e) => e.stopPropagation()}>
                <h2>{t('reconciliation.reviewTitle')}</h2>
                <p>
                    {item.parkZoneCode} · {item.date} · {t(`supervisor.attendanceSession.${item.session}`)}
                </p>
                <ul className="shift-modal-summary">
                    <li>
                        <span>{t('reconciliation.reportedCash')}</span>
                        <strong>{item.reportedCashAmount.toFixed(2)} ETB</strong>
                    </li>
                    <li>
                        <span>{t('finance.cashPayments')} ({t('reconciliation.system')})</span>
                        <strong>{item.systemCashAmount.toFixed(2)} ETB</strong>
                    </li>
                    <li>
                        <span>{t('reconciliation.variance')}</span>
                        <strong>{item.varianceAmount.toFixed(2)} ETB</strong>
                    </li>
                </ul>
                {item.supervisorNotes && (
                    <p className="shift-modal-notes">
                        <strong>{t('reconciliation.supervisorNotes')}:</strong> {item.supervisorNotes}
                    </p>
                )}
                <label>
                    {t('reconciliation.reviewNote')}
                    <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        rows={3}
                    />
                </label>
                <div className="shift-modal-actions">
                    <button type="button" className="shift-btn" onClick={onClose} disabled={loading}>
                        {t('common.cancel')}
                    </button>
                    <button
                        type="button"
                        className="shift-btn shift-btn--danger"
                        onClick={() => onSubmit({ decision: 'reject', reviewNote })}
                        disabled={loading}
                    >
                        <XCircle size={16} />
                        {t('reconciliation.reject')}
                    </button>
                    <button
                        type="button"
                        className="shift-btn shift-btn--primary"
                        onClick={() => onSubmit({ decision: 'approve', reviewNote })}
                        disabled={loading}
                    >
                        <CheckCircle2 size={16} />
                        {t('reconciliation.approve')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FinanceReconciliations = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();

    const [statusFilter, setStatusFilter] = useState('submitted');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [sessionFilter, setSessionFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [reviewTarget, setReviewTarget] = useState(null);
    const [actionError, setActionError] = useState('');

    const filters = useMemo(
        () => ({
            status: statusFilter,
            zone: zoneFilter,
            date: dateFilter || undefined,
            session: sessionFilter,
            page,
            limit: PAGE_SIZE,
        }),
        [statusFilter, zoneFilter, dateFilter, sessionFilter, page]
    );

    const { data: parkZones = [] } = useParkZonesQuery(user?.token);
    const { data, isLoading, error } = useShiftReconciliationsQuery(user?.token, filters);
    const reviewMutation = useReviewShiftReconciliationMutation(user?.token);

    const items = data?.items || [];
    const total = data?.total || 0;
    const totalPages = data?.totalPages || 1;

    const handleFilterChange = (setter) => (event) => {
        setter(event.target.value);
        setPage(1);
    };

    const handleReview = async (payload) => {
        if (!reviewTarget) return;
        setActionError('');
        try {
            await reviewMutation.mutateAsync({ id: reviewTarget._id, ...payload });
            setReviewTarget(null);
        } catch (err) {
            setActionError(getApiError(err, t('reconciliation.reviewFailed')));
        }
    };

    if (isLoading && !data) {
        return <DashboardContentLoader />;
    }

    const errorMessage = error ? getApiError(error, t('reconciliation.loadFailed')) : '';

    return (
        <div className="shift-reconciliation-page shift-reconciliation-page--finance">
            <header className="shift-reconciliation-page__header">
                <div>
                    <h1>
                        <Banknote size={24} />
                        {t('reconciliation.reviewQueueTitle')}
                    </h1>
                    <p>{t('reconciliation.reviewQueueSubtitle')}</p>
                </div>
                <span>{t('reconciliation.totalReports', { count: total })}</span>
            </header>

            {(errorMessage || actionError) && (
                <div className="shift-alert shift-alert--error">{errorMessage || actionError}</div>
            )}

            <div className="shift-filters">
                <select value={statusFilter} onChange={handleFilterChange(setStatusFilter)}>
                    {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                            {status === 'all' ? t('reconciliation.allStatuses') : t(`reconciliation.status.${status}`)}
                        </option>
                    ))}
                </select>
                <select value={zoneFilter} onChange={handleFilterChange(setZoneFilter)}>
                    <option value="all">{t('admin.allZones')}</option>
                    {parkZones.map((zone) => (
                        <option key={zone._id || zone.code} value={zone.code}>
                            {zone.code}
                        </option>
                    ))}
                </select>
                <select value={sessionFilter} onChange={handleFilterChange(setSessionFilter)}>
                    <option value="all">{t('reconciliation.allSessions')}</option>
                    {ATTENDANCE_SESSIONS.map((sessionKey) => (
                        <option key={sessionKey} value={sessionKey}>
                            {t(`supervisor.attendanceSession.${sessionKey}`)}
                        </option>
                    ))}
                </select>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={handleFilterChange(setDateFilter)}
                    aria-label={t('reconciliation.date')}
                />
            </div>

            <div className="shift-recent-table-wrap">
                <table className="shift-recent-table">
                    <thead>
                        <tr>
                            <th>{t('reconciliation.date')}</th>
                            <th>{t('reconciliation.session')}</th>
                            <th>{t('admin.zone')}</th>
                            <th>{t('reconciliation.submittedBy')}</th>
                            <th>{t('reconciliation.reportedCash')}</th>
                            <th>{t('reconciliation.variance')}</th>
                            <th>{t('admin.status')}</th>
                            <th>{t('valet.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="shift-empty">
                                    {t('reconciliation.noReports')}
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.date}</td>
                                    <td>{t(`supervisor.attendanceSession.${item.session}`)}</td>
                                    <td>{item.parkZoneCode}</td>
                                    <td>{item.submittedBy?.name || '—'}</td>
                                    <td>{item.reportedCashAmount.toFixed(2)} ETB</td>
                                    <td className={Math.abs(item.varianceAmount) > 0.01 ? 'has-variance' : ''}>
                                        {item.varianceAmount.toFixed(2)} ETB
                                    </td>
                                    <td>
                                        <span className={`shift-status shift-status--${item.status}`}>
                                            {t(`reconciliation.status.${item.status}`)}
                                        </span>
                                    </td>
                                    <td>
                                        {item.status === 'submitted' ? (
                                            <button
                                                type="button"
                                                className="shift-btn shift-btn--small"
                                                onClick={() => setReviewTarget(item)}
                                            >
                                                {t('reconciliation.review')}
                                            </button>
                                        ) : (
                                            item.reviewNote || '—'
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="shift-pagination">
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

            <ReviewModal
                t={t}
                item={reviewTarget}
                loading={reviewMutation.isPending}
                onClose={() => setReviewTarget(null)}
                onSubmit={handleReview}
            />
        </div>
    );
};

export default FinanceReconciliations;
