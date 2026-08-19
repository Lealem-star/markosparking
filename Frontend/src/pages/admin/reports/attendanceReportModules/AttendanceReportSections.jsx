import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Clock,
    HelpCircle,
    Info,
    Percent,
    Users,
    XCircle,
} from 'lucide-react';
import UserAvatar from '../../../../components/layout/UserAvatar';
import { STATUS_BADGE_CLASS } from '../../../supervisor/attendanceUtils';
import { formatReportEthiopianDate, formatReportEthiopianDateShort } from '../../../../utils/reportUtils';

const PAGE_SIZE = 10;
const DAILY_PREVIEW_COUNT = 7;

const formatShortDate = (dateKey) => formatReportEthiopianDateShort(dateKey);

const getRateStatus = (rate, minRate = 80) => {
    if (rate >= minRate) return 'good';
    if (rate >= minRate * 0.5) return 'warning';
    return 'critical';
};

const getOfficerStatus = (officer, minRate = 80) => {
    if (officer.severity === 'high' || officer.attendanceRate < minRate * 0.5) return 'critical';
    if (officer.needsFollowUp || officer.attendanceRate < minRate) return 'warning';
    return 'good';
};

export const buildAttendanceAlerts = ({
    t,
    policyAlerts = [],
    followUps = [],
    chronicPatterns = [],
    summary = {},
    policyTarget = 80,
}) => {
    const items = [];

    if ((summary.attendanceRate ?? 0) < policyTarget) {
        items.push({
            key: 'rate-below-target',
            level: 'critical',
            target: 'trend',
            title: t('reports.attendanceAlertRateBelowTarget'),
            subtitle: t('reports.attendanceAlertRateBelowTargetDetail', {
                rate: summary.attendanceRate ?? 0,
                target: policyTarget,
            }),
        });
    }

    if ((summary.notMarked ?? 0) > 0) {
        items.push({
            key: 'not-marked',
            level: 'warning',
            target: 'daily',
            title: t('reports.attendanceAlertNotMarked'),
            subtitle: t('reports.attendanceAlertNotMarkedDetail', { count: summary.notMarked ?? 0 }),
        });
    }

    policyAlerts.forEach((alert, index) => {
        items.push({
            key: `policy-${index}`,
            level: alert.level === 'critical' ? 'critical' : alert.level === 'warning' ? 'warning' : 'info',
            target: alert.level === 'info' ? 'coverage' : 'officers',
            title: alert.level === 'critical'
                ? t('reports.attendanceAlertImmediateFollowUp')
                : t('reports.attendanceAlertPolicy'),
            subtitle: alert.message,
        });
    });

    followUps.slice(0, 2).forEach((entry) => {
        items.push({
            key: `follow-up-${entry.officerId}`,
            level: entry.severity === 'high' ? 'critical' : 'warning',
            target: 'officers',
            officerId: entry.officerId,
            title: t('reports.attendanceAlertOfficerFollowUp', { name: entry.name }),
            subtitle: (entry.reasons || []).slice(0, 2).join(' · ') || t('reports.attendanceYesFollowUp'),
        });
    });

    chronicPatterns.slice(0, 1).forEach((entry) => {
        items.push({
            key: `pattern-${entry.officerId}`,
            level: 'info',
            target: 'officers',
            officerId: entry.officerId,
            title: t('reports.attendanceAlertRepeatPattern', { name: entry.name }),
            subtitle: t(`reports.attendancePattern.${entry.pattern}`, {
                late: entry.late,
                absent: entry.absent,
            }),
        });
    });

    return items.slice(0, 5);
};

const buildTrendPath = (values, width, height, padding) => {
    if (!values?.length) return { linePath: '', areaPath: '', points: [] };

    const min = 0;
    const max = 100;
    const range = max - min || 1;
    const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

    const points = values.map((value, index) => {
        const x = padding + index * stepX;
        const normalized = (value - min) / range;
        const y = height - padding - normalized * (height - padding * 2);
        return { x, y, value };
    });

    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { linePath, areaPath, points };
};

export const AttendanceTrendChart = ({ t, dailyTrends = [], policyTarget = 80, sectionRef }) => {
    const chartWidth = 520;
    const chartHeight = 220;
    const padding = 28;

    const rates = dailyTrends.map((day) => day.attendanceRate ?? 0);
    const { linePath, areaPath, points } = buildTrendPath(rates, chartWidth, chartHeight, padding);
    const targetY = chartHeight - padding - (policyTarget / 100) * (chartHeight - padding * 2);

    return (
        <section ref={sectionRef} className="attendance-report-card attendance-report-card--chart">
            <header className="attendance-report-card__header">
                <h2>{t('reports.attendanceTrend')}</h2>
            </header>

            {dailyTrends.length === 0 ? (
                <p className="attendance-report-empty">{t('reports.noDataForPeriod')}</p>
            ) : (
                <div className="attendance-trend-chart">
                    <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="attendance-trend-chart__svg"
                        role="img"
                        aria-label={t('reports.attendanceTrend')}
                    >
                        {[0, 25, 50, 75, 100].map((tick) => {
                            const y = chartHeight - padding - (tick / 100) * (chartHeight - padding * 2);
                            return (
                                <g key={tick}>
                                    <line
                                        x1={padding}
                                        y1={y}
                                        x2={chartWidth - padding}
                                        y2={y}
                                        className="attendance-trend-chart__grid-line"
                                    />
                                    <text x={4} y={y + 4} className="attendance-trend-chart__axis-label">
                                        {tick}%
                                    </text>
                                </g>
                            );
                        })}

                        <line
                            x1={padding}
                            y1={targetY}
                            x2={chartWidth - padding}
                            y2={targetY}
                            className="attendance-trend-chart__target-line"
                        />
                        <text
                            x={chartWidth - padding}
                            y={targetY - 6}
                            textAnchor="end"
                            className="attendance-trend-chart__target-label"
                        >
                            {t('reports.attendancePolicyTarget', { rate: policyTarget })}
                        </text>

                        {areaPath && <path d={areaPath} className="attendance-trend-chart__area" />}
                        {linePath && <path d={linePath} className="attendance-trend-chart__line" />}

                        {points.map((point, index) => (
                            <circle
                                key={dailyTrends[index]?.dateKey || index}
                                cx={point.x}
                                cy={point.y}
                                r={index === points.length - 1 ? 5 : 3.5}
                                className="attendance-trend-chart__point"
                            />
                        ))}
                    </svg>

                    <div className="attendance-trend-chart__legend">
                        <span className="attendance-trend-chart__legend-item attendance-trend-chart__legend-item--rate">
                            {t('reports.attendanceRate')}
                        </span>
                        <span className="attendance-trend-chart__legend-item attendance-trend-chart__legend-item--target">
                            {t('reports.attendancePolicyTarget', { rate: policyTarget })}
                        </span>
                    </div>

                    <div className="attendance-trend-chart__x-labels">
                        {dailyTrends.map((day) => (
                            <span key={day.dateKey}>{formatShortDate(day.dateKey)}</span>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};

export const AttentionRequiredPanel = ({
    t,
    policyAlerts = [],
    followUps = [],
    chronicPatterns = [],
    summary = {},
    policyTarget = 80,
    onAlertClick,
}) => {
    const alerts = useMemo(
        () => buildAttendanceAlerts({ t, policyAlerts, followUps, chronicPatterns, summary, policyTarget }),
        [chronicPatterns, followUps, policyAlerts, policyTarget, summary, t]
    );

    const handleAlertClick = (alert) => {
        onAlertClick?.({
            target: alert.target,
            officerId: alert.officerId,
        });
    };

    return (
        <section className="attendance-report-card attendance-report-card--alerts">
            <header className="attendance-report-card__header">
                <h2>{t('reports.attendanceAttentionRequired')}</h2>
            </header>

            {alerts.length === 0 ? (
                <p className="attendance-report-empty">{t('reports.attendanceNoAlerts')}</p>
            ) : (
                <ul className="attendance-alert-list">
                    {alerts.map((alert) => (
                        <li key={alert.key}>
                            <button
                                type="button"
                                className={`attendance-alert-item attendance-alert-item--${alert.level}`}
                                onClick={() => handleAlertClick(alert)}
                            >
                                <div className="attendance-alert-item__icon">
                                    {alert.level === 'info' ? <Info size={18} /> : <AlertTriangle size={18} />}
                                </div>
                                <div className="attendance-alert-item__content">
                                    <strong>{alert.title}</strong>
                                    <span>{alert.subtitle}</span>
                                </div>
                                <ChevronRight size={18} className="attendance-alert-item__chevron" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export const OfficerBreakdownTable = ({
    t,
    officers = [],
    minRate = 80,
    sectionRef,
    highlightOfficerId,
}) => {
    const [page, setPage] = useState(0);
    const highlightRowRef = useRef(null);
    const totalPages = Math.max(1, Math.ceil(officers.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages - 1);
    const pageOfficers = officers.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

    useEffect(() => {
        setPage(0);
    }, [officers.length]);

    useEffect(() => {
        if (!highlightOfficerId) return;

        const index = officers.findIndex((officer) => officer._id === highlightOfficerId);
        if (index >= 0) {
            setPage(Math.floor(index / PAGE_SIZE));
        }
    }, [highlightOfficerId, officers]);

    useEffect(() => {
        if (!highlightOfficerId || !highlightRowRef.current) return;

        const timer = window.setTimeout(() => {
            highlightRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        return () => window.clearTimeout(timer);
    }, [highlightOfficerId, safePage]);

    return (
        <section ref={sectionRef} className="attendance-report-card attendance-report-card--table">
            <header className="attendance-report-card__header">
                <h2>{t('reports.attendanceOfficerBreakdown')}</h2>
            </header>

            <div className="attendance-report-table-wrap">
                <table className="attendance-report-table">
                    <thead>
                        <tr>
                            <th>{t('admin.name')}</th>
                            <th>{t('dashboard.parkZoneCode')}</th>
                            <th>{t('reports.attendanceOnTime')}</th>
                            <th>{t('reports.attendanceLate')}</th>
                            <th>{t('reports.attendanceUnexcusedAbsent')}</th>
                            <th>{t('reports.attendanceNotMarked')}</th>
                            <th>{t('reports.attendanceRate')}</th>
                            <th>{t('reports.attendanceStatus')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageOfficers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="attendance-report-empty-cell">
                                    {t('reports.noDataForPeriod')}
                                </td>
                            </tr>
                        ) : (
                            pageOfficers.map((officer) => {
                                const status = getOfficerStatus(officer, minRate);
                                const isHighlighted = highlightOfficerId === officer._id;
                                return (
                                    <tr
                                        key={officer._id}
                                        ref={isHighlighted ? highlightRowRef : null}
                                        className={isHighlighted ? 'is-highlighted' : ''}
                                    >
                                        <td>
                                            <div className="attendance-officer-cell">
                                                <UserAvatar user={officer} className="attendance-officer-avatar" />
                                                <div>
                                                    <strong>{officer.name}</strong>
                                                    <small>{officer.phoneNumber || '—'}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{officer.zoneLabel || officer.parkZoneCode || '—'}</td>
                                        <td>{officer.onTime}</td>
                                        <td>{officer.late}</td>
                                        <td>{officer.unexcusedAbsent}</td>
                                        <td>{officer.notMarked}</td>
                                        <td>
                                            <span className={`attendance-rate-badge attendance-rate-badge--${getRateStatus(officer.attendanceRate, minRate)}`}>
                                                {officer.attendanceRate}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`attendance-status-badge attendance-status-badge--${status}`}>
                                                {t(`reports.attendanceStatusLabel.${status}`)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {officers.length > PAGE_SIZE && (
                <footer className="attendance-report-pagination">
                    <button
                        type="button"
                        className="attendance-report-pagination__btn"
                        onClick={() => setPage((current) => Math.max(0, current - 1))}
                        disabled={safePage === 0}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span>{t('reports.paginationLabel', { page: safePage + 1, total: totalPages })}</span>
                    <button
                        type="button"
                        className="attendance-report-pagination__btn"
                        onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                        disabled={safePage >= totalPages - 1}
                    >
                        <ChevronRight size={16} />
                    </button>
                </footer>
            )}
        </section>
    );
};

export const DailyAttendanceSummary = ({ t, dailyTrends = [], sectionRef, expandAll = false }) => {
    const [expanded, setExpanded] = useState(false);
    const showAll = expandAll || expanded;
    const sortedDays = useMemo(
        () => [...dailyTrends].sort((a, b) => (b.dateKey || '').localeCompare(a.dateKey || '')),
        [dailyTrends]
    );
    const visibleDays = showAll ? sortedDays : sortedDays.slice(0, DAILY_PREVIEW_COUNT);

    useEffect(() => {
        if (expandAll) {
            setExpanded(true);
        }
    }, [expandAll]);

    return (
        <section ref={sectionRef} className="attendance-report-card attendance-report-card--daily">
            <header className="attendance-report-card__header">
                <h2>{t('reports.attendanceDailySummary')}</h2>
            </header>

            {dailyTrends.length === 0 ? (
                <p className="attendance-report-empty">{t('reports.noDataForPeriod')}</p>
            ) : (
                <>
                    <div className="attendance-report-table-wrap">
                        <table className="attendance-report-table attendance-report-table--compact">
                            <thead>
                                <tr>
                                    <th>{t('reports.date')}</th>
                                    <th>{t('reports.attendancePresent')}</th>
                                    <th>{t('reports.attendanceLate')}</th>
                                    <th>{t('reports.attendanceAbsent')}</th>
                                    <th>{t('reports.attendanceNotMarked')}</th>
                                    <th>{t('reports.attendanceRate')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleDays.map((day) => (
                                    <tr key={day.dateKey}>
                                        <td>{formatReportEthiopianDate(day.dateKey)}</td>
                                        <td>{day.present}</td>
                                        <td>{day.late}</td>
                                        <td>{day.absent}</td>
                                        <td>{day.notMarked}</td>
                                        <td>
                                            <div className="attendance-rate-bar-cell">
                                                <div className="attendance-rate-bar">
                                                    <span style={{ width: `${day.attendanceRate ?? 0}%` }} />
                                                </div>
                                                <strong>{day.attendanceRate ?? 0}%</strong>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {dailyTrends.length > DAILY_PREVIEW_COUNT && !expandAll && (
                        <button
                            type="button"
                            className="attendance-report-link-btn"
                            onClick={() => setExpanded((value) => !value)}
                        >
                            {expanded ? t('reports.attendanceShowLessDaily') : t('reports.attendanceViewFullDaily')}
                            <ChevronDown size={16} className={expanded ? 'is-open' : ''} />
                        </button>
                    )}
                </>
            )}
        </section>
    );
};

export const DataCoveragePanel = ({ t, dataLimitations = [], sectionRef }) => {
    const limitationSet = new Set(dataLimitations);

    const items = [
        { key: 'attendance_marking', labelKey: 'reports.attendanceCoverageMarking', available: true },
        { key: 'early_departure', labelKey: 'reports.attendanceLimitation.early_departure', available: !limitationSet.has('early_departure') },
        { key: 'detailed_absence_reason', labelKey: 'reports.attendanceLimitation.detailed_absence_reason', available: !limitationSet.has('detailed_absence_reason') },
        { key: 'external_factors', labelKey: 'reports.attendanceLimitation.external_factors', available: !limitationSet.has('external_factors') },
    ];

    return (
        <section ref={sectionRef} className="attendance-report-card attendance-report-card--coverage">
            <header className="attendance-report-card__header">
                <h2>{t('reports.attendanceDataCoverage')}</h2>
            </header>

            <ul className="attendance-coverage-list">
                {items.map((item) => (
                    <li key={item.key} className={`attendance-coverage-item attendance-coverage-item--${item.available ? 'available' : 'missing'}`}>
                        <span>{t(item.labelKey)}</span>
                        <strong>{item.available ? t('reports.attendanceCoverageAvailable') : t('reports.attendanceCoverageNotTracked')}</strong>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export const AttendanceOverviewStats = ({ t, summary = {}, policyTarget = 80 }) => {
    const rateStatus = getRateStatus(summary.attendanceRate ?? 0, policyTarget);

    const cards = [
        {
            key: 'attendanceRate',
            icon: Percent,
            value: `${summary.attendanceRate ?? 0}%`,
            label: t('reports.attendanceRate'),
            modifier: 'rate',
            badge: t(`reports.attendanceStatusLabel.${rateStatus}`),
            badgeModifier: rateStatus,
        },
        {
            key: 'onTime',
            icon: CheckCircle2,
            value: summary.onTime ?? 0,
            label: t('reports.attendanceOnTime'),
            modifier: 'on-time',
            meta: t('reports.attendanceSessionCount', { count: summary.onTime ?? 0 }),
        },
        {
            key: 'late',
            icon: Clock,
            value: summary.late ?? 0,
            label: t('reports.attendanceLate'),
            modifier: 'late',
            meta: t('reports.attendanceSessionCount', { count: summary.late ?? 0 }),
        },
        {
            key: 'unexcusedAbsent',
            icon: XCircle,
            value: summary.unexcusedAbsent ?? 0,
            label: t('reports.attendanceUnexcusedAbsent'),
            modifier: 'absent',
            meta: t('reports.attendanceSessionCount', { count: summary.unexcusedAbsent ?? 0 }),
        },
        {
            key: 'notMarked',
            icon: HelpCircle,
            value: summary.notMarked ?? 0,
            label: t('reports.attendanceNotMarked'),
            modifier: 'not-marked',
            meta: t('reports.attendanceSessionCount', { count: summary.notMarked ?? 0 }),
        },
        {
            key: 'officers',
            icon: Users,
            value: summary.officerCount ?? 0,
            label: t('reports.attendanceOfficers'),
            modifier: 'officers',
            meta: t('reports.attendanceOfficersMonitored', { count: summary.officerCount ?? 0 }),
        },
    ];

    return (
        <div className="attendance-overview-stats">
            {cards.map(({ key, icon: Icon, value, label, modifier, badge, badgeModifier, meta }) => (
                <article key={key} className={`attendance-overview-stat attendance-overview-stat--${modifier}`}>
                    {Icon && (
                        <div className="attendance-overview-stat__icon">
                            <Icon size={18} />
                        </div>
                    )}
                    <div className="attendance-overview-stat__body">
                        <div className="attendance-overview-stat__top">
                            <strong>{value}</strong>
                            {badge && (
                                <span className={`attendance-status-badge attendance-status-badge--${badgeModifier}`}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        <span className="attendance-overview-stat__label">{label}</span>
                        {meta && <small>{meta}</small>}
                    </div>
                </article>
            ))}
        </div>
    );
};

const groupSessionHistoryByDate = (history = []) => {
    const byDate = new Map();

    history.forEach((entry) => {
        if (!byDate.has(entry.dateKey)) {
            byDate.set(entry.dateKey, []);
        }
        byDate.get(entry.dateKey).push(entry);
    });

    return [...byDate.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([dateKey, sessions]) => ({
            dateKey,
            sessions: sessions.sort((a, b) => a.session.localeCompare(b.session)),
        }));
};

export const OfficerHistoryCards = ({ t, officers = [], minRate = 80 }) => {
    if (officers.length === 0) {
        return (
            <section className="attendance-report-card attendance-report-card--officer-history">
                <p className="attendance-report-empty">{t('reports.attendanceNoOfficersFound')}</p>
            </section>
        );
    }

    return (
        <section className="attendance-report-card attendance-report-card--officer-history">
            <header className="attendance-report-card__header">
                <h2>{t('reports.attendanceOfficerHistory')}</h2>
                <span className="attendance-officer-history-count">
                    {t('reports.attendanceOfficerHistoryCount', { count: officers.length })}
                </span>
            </header>

            <div className="attendance-officer-history-grid">
                {officers.map((officer) => {
                    const status = getOfficerStatus(officer, minRate);
                    const historyByDate = groupSessionHistoryByDate(officer.sessionHistory || []);

                    return (
                        <article key={officer._id} className="attendance-officer-history-card">
                            <header className="attendance-officer-history-card__header">
                                <div className="attendance-officer-history-card__profile">
                                    <UserAvatar user={officer} className="attendance-officer-history-card__avatar" />
                                    <div>
                                        <strong>{officer.name}</strong>
                                        <span>{officer.phoneNumber || '—'}</span>
                                        <span>{officer.zoneLabel || officer.parkZoneCode || '—'}</span>
                                    </div>
                                </div>
                                <div className="attendance-officer-history-card__badges">
                                    <span className={`attendance-rate-badge attendance-rate-badge--${getRateStatus(officer.attendanceRate, minRate)}`}>
                                        {officer.attendanceRate}%
                                    </span>
                                    <span className={`attendance-status-badge attendance-status-badge--${status}`}>
                                        {t(`reports.attendanceStatusLabel.${status}`)}
                                    </span>
                                </div>
                            </header>

                            <ul className="attendance-officer-history-card__stats">
                                <li>
                                    <span>{t('reports.attendanceOnTime')}</span>
                                    <strong>{officer.onTime ?? 0}</strong>
                                </li>
                                <li>
                                    <span>{t('reports.attendanceLate')}</span>
                                    <strong>{officer.late ?? 0}</strong>
                                </li>
                                <li>
                                    <span>{t('reports.attendanceUnexcusedAbsent')}</span>
                                    <strong>{officer.unexcusedAbsent ?? 0}</strong>
                                </li>
                                <li>
                                    <span>{t('reports.attendanceNotMarked')}</span>
                                    <strong>{officer.notMarked ?? 0}</strong>
                                </li>
                            </ul>

                            <div className="attendance-officer-history-card__timeline">
                                <h3>{t('reports.attendanceSessionHistory')}</h3>
                                {historyByDate.length === 0 ? (
                                    <p className="attendance-report-empty">{t('reports.noDataForPeriod')}</p>
                                ) : (
                                    <ul className="attendance-officer-history-days">
                                        {historyByDate.map(({ dateKey, sessions }) => (
                                            <li key={dateKey} className="attendance-officer-history-day">
                                                <div className="attendance-officer-history-day__date">
                                                    <strong>{formatReportEthiopianDate(dateKey)}</strong>
                                                </div>
                                                <ul className="attendance-officer-history-sessions">
                                                    {sessions.map((entry) => {
                                                        const badgeClass = STATUS_BADGE_CLASS[entry.status]
                                                            || STATUS_BADGE_CLASS.not_marked;
                                                        return (
                                                            <li key={`${dateKey}-${entry.session}`}>
                                                                <span className="attendance-officer-history-session-label">
                                                                    {t(`supervisor.attendanceSession.${entry.session}`)}
                                                                </span>
                                                                <span className={`attendance-badge ${badgeClass}`}>
                                                                    {t(`supervisor.attendanceStatus.${entry.status}`)}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};
