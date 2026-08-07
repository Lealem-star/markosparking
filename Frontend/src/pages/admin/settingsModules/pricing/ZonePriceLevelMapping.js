import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useCurrentUser } from '../../../../hooks/useAuth';
import { getStaffRoutePath } from '../../../../utils/rolePaths';
import {
    formatSupervisorNames,
    getStaffForParkingZone,
} from '../../staffManagement/staffUtils';
import { getPriceLevelColor } from './pricingUtils';

const ZonePriceLevelMapping = ({ t, mappings, priceLevelNames, users = [], parkZones = [] }) => {
    const navigate = useNavigate();
    const user = useCurrentUser();

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
                    onClick={() => navigate(getStaffRoutePath(user?.type, 'users'))}
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
                                <th>{t('settings.zoneName')}</th>
                                <th>{t('settings.priceLevelName')}</th>
                                <th>{t('settings.supervisedBy')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappings.map((row) => {
                                const colors = row.priceLevelName
                                    ? levelColorMap[row.priceLevelName] || getPriceLevelColor(0)
                                    : null;
                                const { supervisors } = getStaffForParkingZone(
                                    users,
                                    row.zoneCode,
                                    parkZones
                                );
                                const supervisorLabel = formatSupervisorNames(supervisors, t);

                                return (
                                    <tr key={row.zoneCode}>
                                        <td>{row.zoneName || row.zoneCode}</td>
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
                                                </span>
                                            ) : (
                                                <span className="pricing-unassigned">{t('settings.unassigned')}</span>
                                            )}
                                        </td>
                                        <td className="pricing-zone-supervised-cell">{supervisorLabel}</td>
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
