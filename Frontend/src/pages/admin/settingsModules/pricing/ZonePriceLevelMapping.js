import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
import { getPriceLevelColor } from './pricingUtils';

const ZonePriceLevelMapping = ({ t, mappings, priceLevelNames }) => {
    const navigate = useNavigate();

    const levelColorMap = React.useMemo(() => {
        const map = {};
        priceLevelNames.forEach((name, index) => {
            map[name] = getPriceLevelColor(index);
        });
        return map;
    }, [priceLevelNames]);

    return (
        <section className="pricing-zone-mapping-section">
            <div className="pricing-section-header">
                <div>
                    <h3>{t('settings.zonePriceLevelMapping')}</h3>
                    <p className="pricing-section-subtitle">{t('settings.zonePriceLevelMappingHint')}</p>
                </div>
                <button
                    type="button"
                    className="pricing-btn pricing-btn--ghost"
                    onClick={() => navigate('/admin/users')}
                >
                    <ExternalLink size={16} />
                    {t('settings.manageZones')}
                </button>
            </div>

            {mappings.length === 0 ? (
                <div className="pricing-empty-message">
                    <p>{t('settings.noZoneMappings')}</p>
                </div>
            ) : (
                <div className="pricing-table-wrap">
                    <table className="pricing-table pricing-zone-mapping-table">
                        <thead>
                            <tr>
                                <th>{t('admin.zone')}</th>
                                <th>{t('settings.priceLevelName')}</th>
                                <th>{t('settings.assignedValets')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappings.map((row) => {
                                const colors = row.priceLevelName
                                    ? levelColorMap[row.priceLevelName] || getPriceLevelColor(0)
                                    : null;

                                return (
                                    <tr key={row.zoneCode}>
                                        <td>
                                            <span className="pricing-zone-mapping-cell">
                                                <MapPin size={14} />
                                                {row.zoneCode}
                                            </span>
                                        </td>
                                        <td>
                                            {row.priceLevelName ? (
                                                <span
                                                    className="pricing-level-badge pricing-level-badge--table"
                                                    style={colors ? {
                                                        background: colors.bg,
                                                        color: colors.text,
                                                        borderColor: colors.border,
                                                    } : undefined}
                                                >
                                                    {row.priceLevelName}
                                                    {row.hasConflict && (
                                                        <span className="pricing-conflict-tag">
                                                            {t('settings.zoneMappingConflict')}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="pricing-unassigned">{t('settings.unassigned')}</span>
                                            )}
                                        </td>
                                        <td>{row.valetCount}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default ZonePriceLevelMapping;
