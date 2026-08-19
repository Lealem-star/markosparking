import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STAT_CARD_CONFIG = [
    { key: 'open', labelKey: 'supervisor.incidentStatsOpen', modifier: 'open' },
    { key: 'assigned', labelKey: 'supervisor.incidentStatsAssigned', modifier: 'assigned' },
    { key: 'resolved', labelKey: 'supervisor.incidentStatsResolved', modifier: 'resolved' },
];

const IncidentSummaryCards = ({ stats = {}, viewAllPath, titleKey = 'dashboard.incidentsToday' }) => {
    const { t } = useTranslation();

    return (
        <section className="dashboard-card dashboard-ops-panel">
            <header className="card-header">
                <h2>{t(titleKey)}</h2>
                {viewAllPath && (
                    <Link to={viewAllPath} className="dashboard-card-link">
                        {t('dashboard.viewAll')}
                    </Link>
                )}
            </header>
            <div className="dashboard-incident-stats">
                {STAT_CARD_CONFIG.map(({ key, labelKey, modifier }) => (
                    <article key={key} className={`incident-stat-card incident-stat-card--${modifier}`}>
                        <div className="incident-stat-card__value">{stats[key] ?? 0}</div>
                        <div className="incident-stat-card__label">{t(labelKey)}</div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default IncidentSummaryCards;
