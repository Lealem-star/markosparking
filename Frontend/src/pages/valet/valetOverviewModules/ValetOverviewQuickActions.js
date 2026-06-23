import { Car, CheckCircle } from 'lucide-react';

const ValetOverviewQuickActions = ({ onRegister, onViewCars }) => (
    <div className="quick-actions">
        <button type="button" className="action-btn primary" onClick={onRegister}>
            <Car size={20} />
            Register New Car
        </button>
        <button type="button" className="action-btn secondary" onClick={onViewCars}>
            <CheckCircle size={20} />
            View All Cars
        </button>
    </div>
);

export default ValetOverviewQuickActions;
