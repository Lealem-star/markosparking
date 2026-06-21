import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import PricingStatCards from './PricingStatCards';
import PricingFilterBar from './PricingFilterBar';
import PricingZoneAccordion from './PricingZoneAccordion';
import {
    buildPricingGroups,
    filterPricingGroups,
    getPricingStats,
    getUniquePriceLevels,
    getUniqueZones,
} from './pricingUtils';

const CarTypePricingConfiguration = ({
    t,
    priceLevels,
    users,
    lastUpdated,
    loading,
    success,
    error,
    editingPriceLevel,
    editingCarType,
    editPrices,
    onEditPricesChange,
    onEdit,
    onSaveEdit,
    onCancelEdit,
    onDeleteCarType,
    onDeletePriceLevel,
    onAddPriceLevel,
}) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [priceLevelFilter, setPriceLevelFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list');

    const priceLevelNames = useMemo(() => getUniquePriceLevels(priceLevels), [priceLevels]);
    const zones = useMemo(() => getUniqueZones(users), [users]);
    const allGroups = useMemo(() => buildPricingGroups(priceLevels, users), [priceLevels, users]);
    const filteredGroups = useMemo(
        () => filterPricingGroups(allGroups, { searchQuery, zoneFilter, priceLevelFilter }),
        [allGroups, searchQuery, zoneFilter, priceLevelFilter]
    );

    const stats = useMemo(
        () => getPricingStats(priceLevels, users, lastUpdated),
        [priceLevels, users, lastUpdated]
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
                        onClick={() => navigate('/admin/users')}
                    >
                        <MapPin size={16} />
                        {t('settings.manageZones')}
                    </button>
                    {priceLevelFilter !== 'all' && (
                        <button
                            type="button"
                            className="pricing-btn pricing-btn--ghost pricing-btn--danger"
                            onClick={() => onDeletePriceLevel(priceLevelFilter)}
                            disabled={loading}
                        >
                            <Trash2 size={16} />
                            {t('settings.deletePriceLevel')}
                        </button>
                    )}
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

            <PricingFilterBar
                t={t}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                zoneFilter={zoneFilter}
                onZoneChange={setZoneFilter}
                priceLevelFilter={priceLevelFilter}
                onPriceLevelChange={setPriceLevelFilter}
                zones={zones.length > 0 ? zones : priceLevelNames}
                priceLevels={priceLevelNames}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            <div className="pricing-section-header">
                <h3>{t('settings.priceLevelsByZone')}</h3>
                <div className="pricing-legend">
                    {priceLevelNames.slice(0, 4).map((name, index) => {
                        const colors = ['#7c3aed', '#16a34a', '#2563eb', '#ea580c'];
                        return (
                            <span key={name} className="pricing-legend-item">
                                <span className="pricing-legend-dot" style={{ background: colors[index % colors.length] }} />
                                {name}
                            </span>
                        );
                    })}
                </div>
            </div>

            <PricingZoneAccordion
                groups={filteredGroups}
                priceLevelNames={priceLevelNames}
                t={t}
                viewMode={viewMode}
                editingPriceLevel={editingPriceLevel}
                editingCarType={editingCarType}
                editPrices={editPrices}
                onEditPricesChange={onEditPricesChange}
                onEdit={onEdit}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                onDeleteCarType={onDeleteCarType}
                loading={loading}
            />
        </div>
    );
};

export default CarTypePricingConfiguration;
