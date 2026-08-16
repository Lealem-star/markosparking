import React, { useMemo, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import PricingStatCards from './PricingStatCards';
import ParkingZoneListTable from './ParkingZoneListTable';
import PriceLevelListTable from './PriceLevelListTable';
import PriceLevelDetailsModal from './PriceLevelDetailsModal';
import ParkZoneOfficersModal from './ParkZoneOfficersModal';
import ZonePriceLevelMapping from './ZonePriceLevelMapping';
import {
    buildZonePriceLevelMappings,
    getPricingStats,
    getUniquePriceLevels,
} from './pricingUtils';

const CarTypePricingConfiguration = ({
    t,
    priceLevels,
    parkZones,
    users,
    lastUpdated,
    loading,
    success,
    error,
    onDeletePriceLevel,
    onAddPriceLevel,
    onAddParkingZone,
    onEditParkingZone,
    onToggleParkingZoneStatus,
    onOpenEditPriceLevel,
}) => {
    const [viewPriceLevel, setViewPriceLevel] = useState(null);
    const [viewZoneValets, setViewZoneValets] = useState(null);
    const [zoneValets, setZoneValets] = useState([]);

    const priceLevelNames = useMemo(() => getUniquePriceLevels(priceLevels), [priceLevels]);
    const zoneMappings = useMemo(
        () => buildZonePriceLevelMappings(users, parkZones),
        [users, parkZones]
    );
    const stats = useMemo(
        () => getPricingStats(priceLevels, users, lastUpdated, parkZones),
        [priceLevels, users, lastUpdated, parkZones]
    );

    return (
        <div className="pricing-configuration">
            <div className="pricing-page-header">
                <div>
                    <h2>{t('settings.carTypePricingConfiguration')}</h2>
                    <p>{t('settings.pricingConfigSubtitle')}</p>
                </div>
                <div className="pricing-header-actions">
                    <button
                        type="button"
                        className="pricing-btn pricing-btn--ghost"
                        onClick={onAddParkingZone}
                        disabled={loading}
                    >
                        <MapPin size={18} />
                        {t('settings.addParkingZone')}
                    </button>
                    <button
                        type="button"
                        className="pricing-btn pricing-btn--primary"
                        onClick={onAddPriceLevel}
                        disabled={loading}
                    >
                        <Plus size={18} />
                        {t('settings.addPriceLevel')}
                    </button>
                </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <PricingStatCards stats={stats} t={t} />

            <section className="pricing-zone-list-section">
                <div className="pricing-section-header">
                    <div>
                        <h3>{t('settings.parkingZones')}</h3>
                        <p className="pricing-section-subtitle">{t('settings.parkingZonesHint')}</p>
                    </div>
                </div>

                <ParkingZoneListTable
                    t={t}
                    zones={parkZones}
                    users={users}
                    parkZones={parkZones}
                    loading={loading}
                    onEdit={onEditParkingZone}
                    onToggleStatus={onToggleParkingZoneStatus}
                    onViewValets={(zone, valets) => {
                        setViewZoneValets(zone);
                        setZoneValets(valets);
                    }}
                />
            </section>

            <section className="pricing-level-list-section">
                <div className="pricing-section-header">
                    <div>
                        <h3>{t('settings.priceLevels')}</h3>
                        <p className="pricing-section-subtitle">{t('settings.priceLevelListHint')}</p>
                    </div>
                </div>

                <PriceLevelListTable
                    t={t}
                    priceLevelNames={priceLevelNames}
                    loading={loading}
                    onViewDetails={setViewPriceLevel}
                    onEdit={onOpenEditPriceLevel}
                    onDelete={onDeletePriceLevel}
                />
            </section>

            <ZonePriceLevelMapping
                t={t}
                mappings={zoneMappings}
                priceLevelNames={priceLevelNames}
                users={users}
                parkZones={parkZones}
            />

            <PriceLevelDetailsModal
                t={t}
                isOpen={Boolean(viewPriceLevel)}
                priceLevelName={viewPriceLevel}
                pricing={viewPriceLevel ? priceLevels[viewPriceLevel] || {} : {}}
                onClose={() => setViewPriceLevel(null)}
            />

            <ParkZoneOfficersModal
                t={t}
                isOpen={Boolean(viewZoneValets)}
                zone={viewZoneValets}
                officers={zoneValets}
                onClose={() => {
                    setViewZoneValets(null);
                    setZoneValets([]);
                }}
            />
        </div>
    );
};

export default CarTypePricingConfiguration;
