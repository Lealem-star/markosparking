import { Car, LogOut } from 'lucide-react';

const StatSparkline = ({ color }) => (
    <svg className="stat-sparkline" viewBox="0 0 80 32" aria-hidden="true">
        <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,24 12,18 24,22 36,10 48,14 60,6 72,12 80,4"
        />
    </svg>
);

const ParkedCarsStatCards = ({ t, dailyStats }) => (
    <div className="stats-summary-grid">
        <div className="stat-summary-card stat-summary-card--total">
            <div className="stat-summary-icon">P</div>
            <div className="stat-summary-body">
                <span className="stat-summary-label">{t('valet.totalParked')}</span>
                <span className="stat-summary-value">{dailyStats.totalParked}</span>
                <span className="stat-summary-hint">{t('valet.statAllTimeEntries')}</span>
            </div>
            <StatSparkline color="#3b82f6" />
        </div>
        <div className="stat-summary-card stat-summary-card--parked">
            <div className="stat-summary-icon"><Car size={22} /></div>
            <div className="stat-summary-body">
                <span className="stat-summary-label">{t('valet.stillParked')}</span>
                <span className="stat-summary-value">{dailyStats.stillParked}</span>
                <span className="stat-summary-hint">{t('valet.statCurrentlyInPark')}</span>
            </div>
            <StatSparkline color="#22c55e" />
        </div>
        <div className="stat-summary-card stat-summary-card--checked">
            <div className="stat-summary-icon"><LogOut size={22} /></div>
            <div className="stat-summary-body">
                <span className="stat-summary-label">{t('valet.checkedOut')}</span>
                <span className="stat-summary-value">{dailyStats.checkedOut}</span>
                <span className="stat-summary-hint">{t('valet.statToday')}</span>
            </div>
            <StatSparkline color="#8b5cf6" />
        </div>
    </div>
);

export default ParkedCarsStatCards;
