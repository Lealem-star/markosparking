import React, { useMemo, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import PricingTable from './PricingTable';
import { getPriceLevelColor } from './pricingUtils';

const PricingZoneAccordion = ({
    groups,
    priceLevelNames,
    t,
    viewMode,
    editingPriceLevel,
    editingCarType,
    editPrices,
    onEditPricesChange,
    onEdit,
    onSave,
    onCancel,
    onDeleteCarType,
    loading,
}) => {
    const [expandedIds, setExpandedIds] = useState(() => {
        if (groups.length > 0) return new Set([groups[0].id]);
        return new Set();
    });

    const levelColorMap = useMemo(() => {
        const map = {};
        priceLevelNames.forEach((name, index) => {
            map[name] = getPriceLevelColor(index);
        });
        return map;
    }, [priceLevelNames]);

    const toggleGroup = (id) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (groups.length === 0) {
        return (
            <div className="pricing-empty-message">
                <p>{t('settings.noPriceLevels')}</p>
            </div>
        );
    }

    return (
        <div className={`pricing-zone-list ${viewMode === 'grid' ? 'is-grid' : ''}`}>
            {groups.map((group) => {
                const isExpanded = expandedIds.has(group.id);
                const levelColors = levelColorMap[group.priceLevelName] || getPriceLevelColor(0);

                return (
                    <article key={group.id} className={`pricing-zone-card ${isExpanded ? 'is-expanded' : ''}`}>
                        <div className="pricing-zone-card-header">
                            <button
                                type="button"
                                className="pricing-zone-trigger"
                                onClick={() => toggleGroup(group.id)}
                                aria-expanded={isExpanded}
                            >
                                <MapPin size={18} className="pricing-zone-pin" />
                                <span className="pricing-zone-name">{group.zoneCode}</span>
                                <span
                                    className="pricing-level-badge"
                                    style={{
                                        background: levelColors.bg,
                                        color: levelColors.text,
                                        borderColor: levelColors.border,
                                    }}
                                >
                                    {group.priceLevelName}
                                </span>
                            </button>
                            <div className="pricing-zone-header-actions">
                                <span className="pricing-active-pill">{t('admin.active')}</span>
                                <button
                                    type="button"
                                    className="pricing-zone-chevron-btn"
                                    onClick={() => toggleGroup(group.id)}
                                    aria-expanded={isExpanded}
                                    aria-label={group.zoneCode}
                                >
                                    <ChevronDown size={18} className="pricing-zone-chevron" />
                                </button>
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="pricing-zone-panel">
                                <PricingTable
                                    t={t}
                                    priceLevelName={group.priceLevelName}
                                    pricing={group.pricing}
                                    editingPriceLevel={editingPriceLevel}
                                    editingCarType={editingCarType}
                                    editPrices={editPrices}
                                    onEditPricesChange={onEditPricesChange}
                                    onEdit={onEdit}
                                    onSave={onSave}
                                    onCancel={onCancel}
                                    onDeleteCarType={onDeleteCarType}
                                    loading={loading}
                                />
                            </div>
                        )}
                    </article>
                );
            })}
        </div>
    );
};

export default PricingZoneAccordion;
