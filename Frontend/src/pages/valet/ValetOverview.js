import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useAuth';
import { updateParkedCarRecord } from '../../api/api';
import { getApiError } from '../../api/client';
import {
    ValetOverviewQuickActions,
    ValetOverviewStatCards,
    ValetOverviewPackageTable,
    aggregatePackageSubscriptions,
    filterSubscriptionsByPhone,
} from './valetOverviewModules';
import { useParkedCarsQuery, useInvalidateParkingQueries } from '../../hooks/queries';
import '../../styles/valetOverview.scss';

const ValetOverview = () => {
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
            <ValetOverviewQuickActions
                onRegister={() => navigate('/valet/register-car')}
                onViewCars={() => navigate('/valet/cars')}
            />

            <ValetOverviewStatCards stats={packageStats} />

            <ValetOverviewPackageTable
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

export default ValetOverview;
