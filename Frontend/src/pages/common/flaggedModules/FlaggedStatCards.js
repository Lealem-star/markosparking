import React from 'react';
import { Users, MapPin, Wallet } from 'lucide-react';

const FlaggedStatCards = ({ stats, t }) => {
    const cards = [
        {
            key: 'total',
            label: t('valet.totalFlaggedCustomers'),
            value: stats.totalFlagged,
            hint: t('valet.acrossAllZones'),
            icon: <Users size={22} />,
            className: 'flagged-stat-card--total',
        },
        {
            key: 'zones',
            label: t('valet.zones'),
            value: stats.zoneCount,
            hint: t('valet.zonesWithFlagged'),
            icon: <MapPin size={22} />,
            className: 'flagged-stat-card--zones',
        },
        {
            key: 'outstanding',
            label: t('valet.totalOutstanding'),
            value: `${stats.totalOutstanding} ETB`,
            hint: t('valet.unpaidParkingFees'),
            icon: <Wallet size={22} />,
            className: 'flagged-stat-card--outstanding',
        },
    ];

    return (
        <div className="flagged-stats-grid">
            {cards.map((card) => (
                <article key={card.key} className={`flagged-stat-card ${card.className}`}>
                    <div className="flagged-stat-icon">{card.icon}</div>
                    <div className="flagged-stat-body">
                        <span className="flagged-stat-label">{card.label}</span>
                        <span className={`flagged-stat-value ${card.isText ? 'is-date' : ''}`}>{card.value}</span>
                        {card.hint && <span className="flagged-stat-hint">{card.hint}</span>}
                    </div>
                </article>
            ))}
        </div>
    );
};

export default FlaggedStatCards;
