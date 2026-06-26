import React from 'react';
import { Users, Shield, Car, MapPin } from 'lucide-react';

const StatSparkline = ({ color }) => (
    <svg className="staff-stat-sparkline" viewBox="0 0 80 24" aria-hidden="true">
        <polyline
            points="0,18 10,15 20,16 30,11 40,13 50,9 60,10 70,7 80,5"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const StaffStatCards = ({ stats, t }) => {
    const cards = [
        {
            key: 'total',
            label: t('admin.totalStaff'),
            value: stats.totalStaff,
            hint: t('admin.totalStaffHint'),
            icon: <Users size={22} />,
            color: '#8b5cf6',
            className: 'staff-stat-card--total',
        },
        {
            key: 'officeStaff',
            label: t('admin.officeStaff'),
            value: stats.officeStaff,
            hint: t('admin.officeStaffHint'),
            icon: <Shield size={22} />,
            color: '#22c55e',
            className: 'staff-stat-card--managers',
        },
        {
            key: 'valets',
            label: t('admin.valets'),
            value: stats.valets,
            hint: t('admin.valetsHint'),
            icon: <Car size={22} />,
            color: '#3b82f6',
            className: 'staff-stat-card--valets',
        },
        {
            key: 'zones',
            label: t('admin.activeZones'),
            value: stats.activeZones,
            hint: t('admin.activeZonesHint'),
            icon: <MapPin size={22} />,
            color: '#f97316',
            className: 'staff-stat-card--zones',
        },
    ];

    return (
        <div className="staff-stats-grid">
            {cards.map((card) => (
                <article key={card.key} className={`staff-stat-card ${card.className}`}>
                    <div className="staff-stat-icon">{card.icon}</div>
                    <div className="staff-stat-body">
                        <span className="staff-stat-label">{card.label}</span>
                        <span className="staff-stat-value">{card.value}</span>
                        <span className="staff-stat-hint">{card.hint}</span>
                    </div>
                    <StatSparkline color={card.color} />
                </article>
            ))}
        </div>
    );
};

export default StaffStatCards;
