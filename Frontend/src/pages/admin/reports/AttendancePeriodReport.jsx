import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download } from 'lucide-react';
import { useCurrentUser } from '../../../hooks/useAuth';
import { useAttendancePeriodReportQuery } from '../../../hooks/queries';
import { getApiError } from '../../../api/client';
import { formatReportEthiopianDate } from '../../../utils/reportUtils';
import { EthiopianDatePicker } from '../../../components';
import DashboardContentLoader from '../../../components/loading/DashboardContentLoader';
import {
    ATTENDANCE_SESSIONS,
    getAttendancePeriodPresets,
    getTodayDateKey,
} from '../../supervisor/attendanceUtils';
import {
    AttendanceOverviewStats,
    OfficerBreakdownTable,
    DailyAttendanceSummary,
    OfficerHistoryCards,
} from './attendanceReportModules';
import '../../../styles/attendancePeriodReport.scss';

const PRESET_OPTIONS = [
    { key: 'last7', labelKey: 'reports.attendanceLast7Days' },
    { key: 'last30', labelKey: 'reports.attendanceLast30Days' },
    { key: 'thisMonth', labelKey: 'reports.attendanceThisMonth' },
];

const buildDefaultFilters = (presets) => ({
    startDate: presets.last30.start,
    endDate: presets.last30.end,
    session: 'all',
    zone: 'all',
});

const AttendancePeriodReport = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const presets = useMemo(() => getAttendancePeriodPresets(), []);
    const defaultFilters = useMemo(() => buildDefaultFilters(presets), [presets]);

    const [draftFilters, setDraftFilters] = useState(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
    const [activePreset, setActivePreset] = useState('last30');
    const [searchQuery, setSearchQuery] = useState('');
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState('');

    const { data, isLoading, error, isFetching } = useAttendancePeriodReportQuery(
        user?.token,
        appliedFilters
    );

    const trimmedSearch = searchQuery.trim();
    const isSearching = trimmedSearch.length > 0;

    const filteredOfficers = useMemo(() => {
        const officers = data?.officers || [];
        const query = trimmedSearch.toLowerCase();
        if (!query) return officers;

        return officers.filter((officer) => {
            const haystack = [
                officer.name,
                officer.phoneNumber,
                officer.parkZoneCode,
                officer.zoneLabel,
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(query);
        });
    }, [data?.officers, trimmedSearch]);

    const applyPreset = (presetKey) => {
        const preset = presets[presetKey];
        if (!preset) return;

        const nextFilters = {
            ...draftFilters,
            startDate: preset.start,
            endDate: preset.end,
        };

        setActivePreset(presetKey);
        setDraftFilters(nextFilters);
        setAppliedFilters(nextFilters);
    };

    const handleApplyFilters = () => {
        setActivePreset('');
        setAppliedFilters({ ...draftFilters });
    };

    const handleResetFilters = () => {
        setDraftFilters(defaultFilters);
        setAppliedFilters(defaultFilters);
        setActivePreset('last30');
        setSearchQuery('');
    };

    const updateDraft = (key, value) => {
        setDraftFilters((current) => ({ ...current, [key]: value }));
    };

    const summary = data?.summary || {};
    const policyTarget = data?.policyThresholds?.minAttendanceRatePercent ?? 80;

    const periodMeta = useMemo(() => {
        if (!data) return null;
        return {
            start: formatReportEthiopianDate(data.startDate),
            end: formatReportEthiopianDate(data.endDate),
            officers: summary.officerCount ?? 0,
            sessions: data.sessionsPerDay ?? 0,
        };
    }, [data, summary.officerCount]);

    const handleExportPdf = async () => {
        if (!data) return;

        setExportError('');
        setExporting(true);

        try {
            const { exportAttendanceReportToPDF } = await import('../../../utils/pdfExportReact');
            await exportAttendanceReportToPDF({
                title: t('reports.attendanceReports'),
                subtitle: t('reports.attendanceOverviewMeta', periodMeta),
                summary,
                officers: filteredOfficers,
                dailyTrends: data.dailyTrends,
                alerts: [],
                policyTarget,
                filename: `attendance-report-${data.startDate}-to-${data.endDate}.pdf`,
                labels: {
                    summary: t('reports.attendanceOverview'),
                    attendanceRate: t('reports.attendanceRate'),
                    onTime: t('reports.attendanceOnTime'),
                    late: t('reports.attendanceLate'),
                    unexcusedAbsent: t('reports.attendanceUnexcusedAbsent'),
                    notMarked: t('reports.attendanceNotMarked'),
                    officers: t('reports.attendanceOfficers'),
                    policyTarget: t('reports.attendancePolicyTarget', { rate: policyTarget }),
                    attentionRequired: t('reports.attendanceAttentionRequired'),
                    officerBreakdown: t('reports.attendanceOfficerBreakdown'),
                    dailySummary: t('reports.attendanceDailySummary'),
                    name: t('admin.name'),
                    zone: t('reports.zone'),
                    present: t('reports.attendancePresent'),
                    absent: t('reports.attendanceAbsent'),
                    date: t('reports.date'),
                    rate: t('reports.attendanceRate'),
                },
            });
        } catch (pdfError) {
            console.error('Attendance PDF export failed:', pdfError);
            setExportError(t('reports.failedToExport'));
        } finally {
            setExporting(false);
        }
    };

    if (isLoading && !data) {
        return <DashboardContentLoader />;
    }

    const errorMessage = error ? getApiError(error, t('reports.attendanceLoadFailed')) : exportError;

    return (
        <div className="attendance-period-report">
            {errorMessage && (
                <div className="attendance-period-report__alert">{errorMessage}</div>
            )}

            <section className="attendance-period-report__overview-card">
                <header className="attendance-period-report__overview-header">
                    <div>
                        <h1>{t('reports.attendanceOverview')}</h1>
                        {periodMeta && (
                            <p>
                                {t('reports.attendanceOverviewMeta', periodMeta)}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        className="attendance-period-report__export-btn"
                        onClick={handleExportPdf}
                        disabled={!data || filteredOfficers.length === 0 || exporting}
                    >
                        <Download size={18} />
                        {exporting ? t('common.loading') : t('reports.exportPDF')}
                    </button>
                </header>

                <div className="attendance-period-report__presets">
                    {PRESET_OPTIONS.map(({ key, labelKey }) => (
                        <button
                            key={key}
                            type="button"
                            className={activePreset === key ? 'is-active' : ''}
                            onClick={() => applyPreset(key)}
                        >
                            {t(labelKey)}
                        </button>
                    ))}
                </div>

                <div className="attendance-period-report__filters">
                    <EthiopianDatePicker
                        value={draftFilters.startDate}
                        onChange={(value) => updateDraft('startDate', value)}
                        label={t('reports.startDate')}
                        maxDate={draftFilters.endDate}
                        className="attendance-period-report__date-picker"
                    />
                    <EthiopianDatePicker
                        value={draftFilters.endDate}
                        onChange={(value) => updateDraft('endDate', value)}
                        label={t('reports.endDate')}
                        minDate={draftFilters.startDate}
                        maxDate={getTodayDateKey()}
                        className="attendance-period-report__date-picker"
                    />

                    <label>
                        <span>{t('supervisor.attendanceSessionLabel')}</span>
                        <select
                            value={draftFilters.session}
                            onChange={(event) => updateDraft('session', event.target.value)}
                        >
                            <option value="all">{t('reports.attendanceAllSessions')}</option>
                            {ATTENDANCE_SESSIONS.map((session) => (
                                <option key={session} value={session}>
                                    {t(`supervisor.attendanceSession.${session}`)}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>{t('reports.zone')}</span>
                        <select
                            value={draftFilters.zone}
                            onChange={(event) => updateDraft('zone', event.target.value)}
                        >
                            <option value="all">{t('reports.allZones')}</option>
                            {(data?.zones || []).map((zone) => (
                                <option key={zone.code} value={zone.code}>
                                    {zone.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="attendance-period-report__search">
                        <Search size={18} />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={t('supervisor.searchOfficersPlaceholder')}
                        />
                    </label>

                    <div className="attendance-period-report__filter-actions">
                        <button
                            type="button"
                            className="attendance-period-report__apply-btn"
                            onClick={handleApplyFilters}
                            disabled={isFetching}
                        >
                            {isFetching ? t('common.loading') : t('reports.applyFilters')}
                        </button>
                        <button
                            type="button"
                            className="attendance-period-report__reset-btn"
                            onClick={handleResetFilters}
                        >
                            {t('reports.resetFilters')}
                        </button>
                    </div>
                </div>

                {data && (
                    <AttendanceOverviewStats
                        t={t}
                        summary={summary}
                        policyTarget={policyTarget}
                    />
                )}
            </section>

            {data && isSearching && (
                <OfficerHistoryCards
                    t={t}
                    officers={filteredOfficers}
                    minRate={policyTarget}
                />
            )}

            {data && (
                <div className="attendance-period-report__grid attendance-period-report__grid--tables">
                    <div className="attendance-period-report__left-stack">
                        <OfficerBreakdownTable
                            t={t}
                            officers={filteredOfficers}
                            minRate={policyTarget}
                        />
                    </div>
                    <DailyAttendanceSummary
                        t={t}
                        dailyTrends={data.dailyTrends}
                    />
                </div>
            )}
        </div>
    );
};

export default AttendancePeriodReport;
