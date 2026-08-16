import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import { useUsersQuery, useParkZonesQuery } from '../../hooks/queries';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import SupervisorParkingOfficerTable from './SupervisorParkingOfficerTable';
import {
    filterSupervisorParkingOfficers,
    getSupervisorParkingOfficers,
    getSupervisorZoneFilterOptions,
} from './supervisorUtils';
import '../../styles/supervisorPortal.scss';

const SupervisorParkingOfficerList = () => {
    const { t } = useTranslation();
    const user = useCurrentUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState('all');

    const { data: users = [], isLoading } = useUsersQuery(user?.token);
    const { data: parkZones = [] } = useParkZonesQuery(user?.token);

    const supervisorOfficers = useMemo(
        () => getSupervisorParkingOfficers(users, user),
        [users, user]
    );

    const zoneOptions = useMemo(
        () => getSupervisorZoneFilterOptions(user, parkZones, supervisorOfficers),
        [user, parkZones, supervisorOfficers]
    );

    useEffect(() => {
        setZoneFilter('all');
    }, [user?.parkZoneCode]);

    const filteredOfficers = useMemo(
        () => filterSupervisorParkingOfficers(supervisorOfficers, { searchQuery, zoneFilter }),
        [supervisorOfficers, searchQuery, zoneFilter]
    );

    if (isLoading) {
        return <DashboardContentLoader />;
    }

    return (
        <div className="supervisor-portal">
            <div className="supervisor-filter-bar">
                <label className="supervisor-search-field">
                    <Search size={18} />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t('supervisor.searchValetsPlaceholder')}
                    />
                </label>

                {zoneOptions.length > 1 && (
                    <select
                        className="supervisor-zone-filter"
                        value={zoneFilter}
                        onChange={(event) => setZoneFilter(event.target.value)}
                    >
                        <option value="all">{t('supervisor.allAssignedZones')}</option>
                        {zoneOptions.map((zone) => (
                            <option key={zone.code} value={zone.code}>
                                {zone.name} ({zone.code})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <section className="supervisor-panel">
                <SupervisorParkingOfficerTable
                    officers={filteredOfficers}
                    parkZones={parkZones}
                    t={t}
                    emptyMessage={t('supervisor.noValetsInZone')}
                />
            </section>
        </div>
    );
};

export default SupervisorParkingOfficerList;
