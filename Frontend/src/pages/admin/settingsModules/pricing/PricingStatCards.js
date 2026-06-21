import React from 'react';
import { Layers, Tags, Car, TrendingUp } from 'lucide-react';

const PricingStatCards = ({ stats, t }) => {
    const cards = [
        {
            key: 'zones',
            label: t('settings.totalZones'),
            value: stats.totalZones,
            icon: <Layers size={22} />,
            className: 'pricing-stat-card--zones',
        },
        {
            key: 'levels',
            label: t('settings.priceLevels'),
            value: stats.priceLevelCount,
            icon: <Tags size={22} />,
            className: 'pricing-stat-card--levels',
        },
        {
            key: 'types',
            label: t('settings.carTypes'),
            value: stats.carTypeCount,
            icon: <Car size={22} />,
            className: 'pricing-stat-card--types',
        },
        {
            key: 'updated',
            label: t('settings.lastUpdated'),
            value: stats.lastUpdated,
            icon: <TrendingUp size={22} />,
            className: 'pricing-stat-card--updated',
            isText: true,
        },
    ];

    return (
        <div className="pricing-stats-grid">
            {cards.map((card) => (
                <article key={card.key} className={`pricing-stat-card ${card.className}`}>
                    <div className="pricing-stat-icon">{card.icon}</div>
                    <div className="pricing-stat-body">
                        <span className="pricing-stat-label">{card.label}</span>
                        <span className={`pricing-stat-value ${card.isText ? 'is-date' : ''}`}>{card.value}</span>
                    </div>
                </article>
            ))}
        </div>
    );
};

export default PricingStatCards;
