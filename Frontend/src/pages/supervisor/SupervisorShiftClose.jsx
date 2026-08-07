import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Sun, Sunset, RefreshCw } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import {
    useParkZonesQuery,
    useShiftReconciliationPreviewQuery,
    useSubmitShiftReconciliationMutation,
    useShiftReconciliationsQuery,
} from '../../hooks/queries';
import { getApiError } from '../../api/client';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import { ATTENDANCE_SESSIONS, getTodayDateKey } from './attendanceUtils';
import { getSupervisorZoneFilterOptions } from './supervisorUtils';
import '../../styles/shiftReconciliation.scss';

const SESSION_ICONS = { morning: Sun, afternoon: Sunset };

const SupervisorShiftClose = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();

    const [date, setDate] = useState(getTodayDateKey());
    const [session, setSession] = useState('morning');
    const [zoneCode, setZoneCode] = useState('');
    const [reportedCash, setReportedCash] = useState('');
    const [notes, setNotes] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    const { data: parkZones = [] } = useParkZonesQuery(user?.token);
    const zoneOptions = useMemo(
        () => getSupervisorZoneFilterOptions(user, parkZones),
        [user, parkZones]
    );

    useEffect(() => {
        if (!zoneCode && zoneOptions.length === 1) {
            setZoneCode(zoneOptions[0].code);
        }
    }, [zoneCode, zoneOptions]);

    const previewParams = useMemo(
        () => ({ date, session, parkZoneCode: zoneCode }),
        [date, session, zoneCode]
    );

    const {
        data: preview,
        isLoading: loadingPreview,
        refetch: refetchPreview,
    } = useShiftReconciliationPreviewQuery(user?.token, previewParams);

    const { data: recentData, isLoading: loadingRecent } = useShiftReconciliationsQuery(
        user?.token,
        { page: 1, limit: 10 }
    );

    const submitMutation = useSubmitShiftReconciliationMutation(user?.token);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setActionError('');
        setActionSuccess('');

        const amount = parseFloat(reportedCash);
        if (!zoneCode) {
            setActionError(t('reconciliation.zoneRequired'));
            return;
        }
        if (!Number.isFinite(amount) || amount < 0) {
            setActionError(t('reconciliation.invalidCashAmount'));
            return;
        }

        try {
            await submitMutation.mutateAsync({
                date,
                session,
                parkZoneCode: zoneCode,
                reportedCashAmount: amount,
                supervisorNotes: notes,
            });
            setActionSuccess(t('reconciliation.submitSuccess'));
            setNotes('');
        } catch (err) {
            setActionError(getApiError(err, t('reconciliation.submitFailed')));
        }
    };

    if (loadingRecent && !recentData) {
        return <DashboardContentLoader />;
    }

    const recentItems = recentData?.items || [];
    const variance = preview
        ? (parseFloat(reportedCash) || 0) - preview.systemCashAmount
        : 0;

    return (
        <div className="shift-reconciliation-page">
            <header className="shift-reconciliation-page__header">
                <div>
                    <h1>
                        <Banknote size={24} />
                        {t('reconciliation.shiftCloseTitle')}
                    </h1>
                    <p>{t('reconciliation.shiftCloseSubtitle')}</p>
                </div>
            </header>

            {actionError && <div className="shift-alert shift-alert--error">{actionError}</div>}
            {actionSuccess && <div className="shift-alert shift-alert--success">{actionSuccess}</div>}

            <form className="shift-close-form" onSubmit={handleSubmit}>
                <div className="shift-close-form__row">
                    <label>
                        {t('reconciliation.date')}
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </label>

                    <label>
                        {t('reconciliation.zone')}
                        <select value={zoneCode} onChange={(e) => setZoneCode(e.target.value)} required>
                            <option value="">{t('reconciliation.selectZone')}</option>
                            {zoneOptions.map((zone) => (
                                <option key={zone.code} value={zone.code}>
                                    {zone.name} ({zone.code})
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="shift-session-toggle">
                    {ATTENDANCE_SESSIONS.map((sessionKey) => {
                        const Icon = SESSION_ICONS[sessionKey];
                        return (
                            <button
                                key={sessionKey}
                                type="button"
                                className={`shift-session-btn ${session === sessionKey ? 'is-active' : ''}`}
                                onClick={() => setSession(sessionKey)}
                            >
                                <Icon size={16} />
                                {t(`supervisor.attendanceSession.${sessionKey}`)}
                            </button>
                        );
                    })}
                </div>

                {zoneCode && (
                    <div className="shift-system-totals">
                        <div className="shift-system-totals__header">
                            <h2>{t('reconciliation.systemTotals')}</h2>
                            <button
                                type="button"
                                className="shift-btn shift-btn--ghost"
                                onClick={() => refetchPreview()}
                                disabled={loadingPreview}
                            >
                                <RefreshCw size={14} />
                                {t('common.refresh')}
                            </button>
                        </div>
                        {loadingPreview ? (
                            <p>{t('common.loading')}</p>
                        ) : preview ? (
                            <ul>
                                <li>
                                    <span>{t('finance.cashPayments')}</span>
                                    <strong>{preview.systemCashAmount.toFixed(2)} ETB</strong>
                                </li>
                                <li>
                                    <span>{t('finance.onlinePayments')}</span>
                                    <strong>{preview.systemOnlineAmount.toFixed(2)} ETB</strong>
                                </li>
                                <li>
                                    <span>{t('reconciliation.systemTotal')}</span>
                                    <strong>{preview.systemTotalAmount.toFixed(2)} ETB</strong>
                                </li>
                                {preview.existingStatus && (
                                    <li>
                                        <span>{t('reconciliation.currentStatus')}</span>
                                        <strong>{t(`reconciliation.status.${preview.existingStatus}`)}</strong>
                                    </li>
                                )}
                            </ul>
                        ) : null}
                    </div>
                )}

                <label>
                    {t('reconciliation.reportedCash')}
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={reportedCash}
                        onChange={(e) => setReportedCash(e.target.value)}
                        placeholder="0.00"
                        required
                    />
                </label>

                {preview && reportedCash !== '' && (
                    <p className={`shift-variance ${Math.abs(variance) > 0.01 ? 'has-variance' : 'is-balanced'}`}>
                        {t('reconciliation.variance')}: {variance.toFixed(2)} ETB
                    </p>
                )}

                <label>
                    {t('reconciliation.supervisorNotes')}
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder={t('reconciliation.notesPlaceholder')}
                    />
                </label>

                <button
                    type="submit"
                    className="shift-btn shift-btn--primary"
                    disabled={submitMutation.isPending || !zoneCode || preview?.existingStatus === 'approved'}
                >
                    {submitMutation.isPending ? t('common.loading') : t('reconciliation.submitShiftClose')}
                </button>
            </form>

            <section className="shift-recent-list">
                <h2>{t('reconciliation.recentSubmissions')}</h2>
                {recentItems.length === 0 ? (
                    <p>{t('reconciliation.noSubmissions')}</p>
                ) : (
                    <div className="shift-recent-table-wrap">
                        <table className="shift-recent-table">
                            <thead>
                                <tr>
                                    <th>{t('reconciliation.date')}</th>
                                    <th>{t('reconciliation.session')}</th>
                                    <th>{t('admin.zone')}</th>
                                    <th>{t('reconciliation.reportedCash')}</th>
                                    <th>{t('reconciliation.variance')}</th>
                                    <th>{t('admin.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentItems.map((item) => (
                                    <tr key={item._id}>
                                        <td>{item.date}</td>
                                        <td>{t(`supervisor.attendanceSession.${item.session}`)}</td>
                                        <td>{item.parkZoneCode}</td>
                                        <td>{item.reportedCashAmount.toFixed(2)} ETB</td>
                                        <td>{item.varianceAmount.toFixed(2)} ETB</td>
                                        <td>
                                            <span className={`shift-status shift-status--${item.status}`}>
                                                {t(`reconciliation.status.${item.status}`)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default SupervisorShiftClose;
