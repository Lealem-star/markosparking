import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import PricingStatCards from './PricingStatCards';
import PriceLevelListTable from './PriceLevelListTable';
import PriceLevelDetailsModal from './PriceLevelDetailsModal';
import ZonePriceLevelMapping from './ZonePriceLevelMapping';
import {
    buildZonePriceLevelMappings,
    getPricingStats,
    getUniquePriceLevels,
} from './pricingUtils';

const CarTypePricingConfiguration = ({
    t,
    priceLevels,
    users,
    lastUpdated,
    loading,
    success,
    error,
    onDeletePriceLevel,
    onAddPriceLevel,
    onOpenEditPriceLevel,
}) => {
    const [viewPriceLevel, setViewPriceLevel] = useState(null);

    const priceLevelNames = useMemo(() => getUniquePriceLevels(priceLevels), [priceLevels]);
    const zoneMappings = useMemo(() => buildZonePriceLevelMappings(users), [users]);
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
            />

            <PriceLevelDetailsModal
                t={t}
                isOpen={Boolean(viewPriceLevel)}
                priceLevelName={viewPriceLevel}
                pricing={viewPriceLevel ? priceLevels[viewPriceLevel] || {} : {}}
                onClose={() => setViewPriceLevel(null)}
            />
        </div>
    );
};

export default CarTypePricingConfiguration;
