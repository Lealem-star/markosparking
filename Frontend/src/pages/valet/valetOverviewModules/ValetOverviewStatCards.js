const STAT_CARDS = [
    { key: 'weekly', label: 'Weekly Registered', stroke: '#4facfe', className: 'stat-circle-weekly', arcId: 'arc-weekly' },
    { key: 'monthly', label: 'Monthly Registered', stroke: '#667eea', className: 'stat-circle-monthly', arcId: 'arc-monthly' },
    { key: 'yearly', label: 'Yearly Registered', stroke: '#f093fb', className: 'stat-circle-yearly', arcId: 'arc-yearly' },
    { key: 'currentlyParked', label: 'Currently Parked', stroke: '#4facfe', className: 'stat-circle-parked', arcId: 'arc-parked-overview' },
];

const ValetOverviewStatCards = ({ stats }) => (
    <div className="stats-grid stats-grid-circular">
        {STAT_CARDS.map(({ key, label, stroke, className, arcId }) => (
            <div key={key} className={`stat-circle-card ${className}`}>
                <div className="stat-circle-wrapper">
                    <svg viewBox="0 0 120 130" className="stat-circle-svg">
                        <defs>
                            <path id={arcId} d="M 15,65 A 45,45 0 0,1 105,65" fill="none" />
                        </defs>
                        <circle cx="60" cy="65" r="45" className="stat-circle-ring-svg" fill="none" stroke={stroke} strokeWidth="10" />
                        <text>
                            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">{label}</textPath>
                        </text>
                        <text x="60" y="72" textAnchor="middle" className="stat-circle-value-svg">{stats[key] ?? 0}</text>
                    </svg>
                </div>
            </div>
        ))}
    </div>
);

export default ValetOverviewStatCards;
