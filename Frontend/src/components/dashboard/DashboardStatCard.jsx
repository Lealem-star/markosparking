import React from 'react';
import StatSparkline from './StatSparkline';

const DashboardStatCard = ({
    icon: Icon,
    value,
    label,
    modifier = 'cars',
    sparklineValues,
    sparklineColor,
    delta,
    meta,
}) => (
    <article className={`stat-card stat-card--${modifier}`}>
        <div className="stat-card-body">
            {Icon && (
                <div className="stat-icon">
                    <Icon size={20} />
                </div>
            )}
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            {delta != null && (
                <div className={`stat-delta ${delta >= 0 ? 'stat-delta--up' : 'stat-delta--down'}`}>
                    {delta >= 0 ? '+' : ''}{delta}% vs yesterday
                </div>
            )}
            {meta && <div className="stat-meta">{meta}</div>}
        </div>
        {sparklineValues && (
            <div className="stat-sparkline-wrap">
                <StatSparkline values={sparklineValues} color={sparklineColor} />
            </div>
        )}
        <div className="stat-card-glow" aria-hidden="true" />
    </article>
);

export default DashboardStatCard;
