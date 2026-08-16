import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParkingOfficerRoutePath } from '../../utils/rolePaths';
import { useCurrentUser } from '../../hooks/useAuth';
import { updateParkedCarRecord } from '../../api/api';
import { getApiError } from '../../api/client';
import {
    OverviewQuickActions,
    OverviewStatCards,
    OverviewPackageTable,
    aggregatePackageSubscriptions,
    filterSubscriptionsByPhone,
} from './overviewModules';
import { useParkedCarsQuery, useInvalidateParkingQueries } from '../../hooks/queries';
import '../../styles/parkingOfficerOverview.scss';

const ParkingOfficerOverview = () => {
    const user = useCurrentUser();
    const navigate = useNavigate();
    const { invalidateAll } = useInvalidateParkingQueries();

    const [parkInLoadingId, setParkInLoadingId] = useState(null);
    const [error, setError] = useState(null);
    const [phoneFilter, setPhoneFilter] = useState('');

    const { data: allCars = [] } = useParkedCarsQuery(user?.token, {});

    const { stats: packageStats, subscriptions: packageServices } = useMemo(() => {
        const packageCars = allCars.filter((car) => car.serviceType === 'package');
        return aggregatePackageSubscriptions(packageCars);
    }, [allCars]);

    const filteredPackageServices = useMemo(
        () => filterSubscriptionsByPhone(packageServices, phoneFilter),
        [packageServices, phoneFilter]
    );

    const handleParkIn = async (sub) => {
        if (!sub.lastCheckedOutRecord || !user?.token) return;

        setError(null);
        setParkInLoadingId(sub.key);

        try {
            await updateParkedCarRecord(sub.lastCheckedOutRecord._id, { status: 'parked' }, user.token);
            setParkInLoadingId(null);
            invalidateAll();
        } catch (err) {
            setParkInLoadingId(null);
            setError(getApiError(err, 'Failed to park in. Please try again.'));
        }
    };

    return (
        <div className="valet-overview">
            <OverviewQuickActions
                onRegister={() => navigate(getParkingOfficerRoutePath('register-car'))}
                onViewCars={() => navigate(getParkingOfficerRoutePath('cars'))}
            />

            <OverviewStatCards stats={packageStats} />

            <OverviewPackageTable
                subscriptions={packageServices}
                filteredSubscriptions={filteredPackageServices}
                phoneFilter={phoneFilter}
                onPhoneFilterChange={setPhoneFilter}
                error={error}
                onDismissError={() => setError(null)}
                parkInLoadingId={parkInLoadingId}
                onParkIn={handleParkIn}
            />
        </div>
    );
};

export default ParkingOfficerOverview;
