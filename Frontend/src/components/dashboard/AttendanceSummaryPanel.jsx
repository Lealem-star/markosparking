import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Sunset } from 'lucide-react';

const SESSION_ICONS = {
    morning: Sun,
    afternoon: Sunset,
};

const SessionSummary = ({ sessionKey, session, t }) => {
    const stats = session?.stats || {};
    const Icon = SESSION_ICONS[sessionKey];

    return (
        <article className="dashboard-attendance-session">
            <header className="dashboard-attendance-session__header">
                <Icon size={16} />
                <h3>{t(`supervisor.attendanceSession.${sessionKey}`)}</h3>
            </header>
            <ul className="dashboard-attendance-metrics">
                <li>
                    <span>{t('supervisor.statsExpected')}</span>
                    <strong>{stats.expected ?? 0}</strong>
                </li>
                <li>
                    <span>{t('supervisor.statsPresent')}</span>
                    <strong>{stats.present ?? 0}</strong>
                </li>
                <li>
                    <span>{t('supervisor.statsLate')}</span>
                    <strong>{stats.late ?? 0}</strong>
                </li>
                <li>
                    <span>{t('supervisor.statsAbsent')}</span>
                    <strong>{stats.absent ?? 0}</strong>
                </li>
                <li>
                    <span>{t('supervisor.statsNotMarked')}</span>
                    <strong>{stats.notMarked ?? 0}</strong>
                </li>
            </ul>
        </article>
    );
};

const AttendanceSummaryPanel = ({ morningSession, afternoonSession, viewAllPath }) => {
    const { t } = useTranslation();

    return (
        <section className="dashboard-card dashboard-ops-panel">
            <header className="card-header">
                <h2>{t('dashboard.attendanceToday')}</h2>
                {viewAllPath && (
                    <Link to={viewAllPath} className="dashboard-card-link">
                        {t('dashboard.viewReport')}
                    </Link>
                )}
            </header>
            <div className="dashboard-attendance-grid">
                <SessionSummary sessionKey="morning" session={morningSession} t={t} />
                <SessionSummary sessionKey="afternoon" session={afternoonSession} t={t} />
            </div>
        </section>
    );
};

export default AttendanceSummaryPanel;
