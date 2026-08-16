import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, UserPlus, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useAuth';
import {
    useIncidentsQuery,
    useCreateIncidentMutation,
    useAssignIncidentMutation,
    useResolveIncidentMutation,
    useUsersQuery,
} from '../../hooks/queries';
import { getApiError } from '../../api/client';
import DashboardContentLoader from '../../components/loading/DashboardContentLoader';
import {
    AssignIncidentModal,
    CreateIncidentModal,
    ResolveIncidentModal,
} from './IncidentModals';
import {
    filterOfficersForZone,
    formatIncidentDate,
    getDefaultIncidentZone,
    INCIDENT_STATUS_BADGE,
    INCIDENT_STATUSES,
    INCIDENT_TYPES,
} from './incidentUtils';
import { getSupervisorParkingOfficers } from './supervisorUtils';
import '../../styles/supervisorIncidents.scss';

const STAT_CARD_CONFIG = [
    { key: 'open', labelKey: 'supervisor.incidentStatsOpen', modifier: 'open' },
    { key: 'assigned', labelKey: 'supervisor.incidentStatsAssigned', modifier: 'assigned' },
    { key: 'resolved', labelKey: 'supervisor.incidentStatsResolved', modifier: 'resolved' },
];

const SupervisorIncidents = () => {
    const { t, i18n } = useTranslation();
    const user = useCurrentUser();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [zoneFilter, setZoneFilter] = useState('all');
    const [actionError, setActionError] = useState('');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [assignTarget, setAssignTarget] = useState(null);
    const [resolveTarget, setResolveTarget] = useState(null);

    const filters = useMemo(
        () => ({
            status: statusFilter,
            type: typeFilter,
            zone: zoneFilter,
            search: searchQuery,
        }),
        [statusFilter, typeFilter, zoneFilter, searchQuery]
    );

    const {
        data,
        isLoading,
        error: loadError,
    } = useIncidentsQuery(user?.token, filters);

    const { data: users = [] } = useUsersQuery(user?.token);
    const createMutation = useCreateIncidentMutation(user?.token, filters);
    const assignMutation = useAssignIncidentMutation(user?.token, filters);
    const resolveMutation = useResolveIncidentMutation(user?.token, filters);

    const supervisorOfficers = useMemo(
        () => getSupervisorParkingOfficers(users, user),
        [users, user]
    );

    const assignOfficers = useMemo(
        () => filterOfficersForZone(supervisorOfficers, assignTarget?.parkZoneCode),
        [supervisorOfficers, assignTarget?.parkZoneCode]
    );

    const defaultZone = useMemo(
        () => getDefaultIncidentZone(data?.assignedZones || []),
        [data?.assignedZones]
    );

    const incidents = data?.incidents || [];
    const stats = data?.stats || { open: 0, assigned: 0, resolved: 0, total: 0 };

    const handleCreate = async (body) => {
        setActionError('');
        await createMutation.mutateAsync(body);
    };

    const handleAssign = async (payload) => {
        setActionError('');
        await assignMutation.mutateAsync(payload);
    };

    const handleResolve = async (payload) => {
        setActionError('');
        await resolveMutation.mutateAsync(payload);
    };

    if (isLoading) {
        return <DashboardContentLoader />;
    }

    const errorMessage = loadError
        ? getApiError(loadError, t('supervisor.incidentLoadFailed'))
        : actionError;

    return (
        <div className="supervisor-incidents">
            {errorMessage && (
                <div className="supervisor-alert supervisor-alert--error">{errorMessage}</div>
            )}

            <header className="supervisor-incidents__header">
                <div>
                    <h1>{t('supervisor.incidents')}</h1>
                    <p>{t('supervisor.incidentsSubtitle')}</p>
                </div>
                <button
                    type="button"
                    className="incident-btn incident-btn--primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={18} />
                    {t('supervisor.createIncident')}
                </button>
            </header>

            <div className="supervisor-incidents__stats">
                {STAT_CARD_CONFIG.map(({ key, labelKey, modifier }) => (
                    <article key={key} className={`incident-stat-card incident-stat-card--${modifier}`}>
                        <div className="incident-stat-card__value">{stats[key] ?? 0}</div>
                        <div className="incident-stat-card__label">{t(labelKey)}</div>
                    </article>
                ))}
            </div>

            <div className="supervisor-incidents__filters">
                <label className="supervisor-search-field">
                    <Search size={18} />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t('supervisor.incidentSearchPlaceholder')}
                    />
                </label>

                <select
                    className="supervisor-zone-filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                >
                    <option value="all">{t('supervisor.allIncidentStatuses')}</option>
                    {INCIDENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {t(`supervisor.incidentStatus.${status}`)}
                        </option>
                    ))}
                </select>

                <select
                    className="supervisor-zone-filter"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                >
                    <option value="all">{t('supervisor.allIncidentTypes')}</option>
                    {INCIDENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                            {t(`supervisor.incidentTypes.${type}`)}
                        </option>
                    ))}
                </select>

                {(data?.assignedZones || []).length > 1 && (
                    <select
                        className="supervisor-zone-filter"
                        value={zoneFilter}
                        onChange={(event) => setZoneFilter(event.target.value)}
                    >
                        <option value="all">{t('supervisor.allAssignedZones')}</option>
                        {data.assignedZones.map((zone) => (
                            <option key={zone.code} value={zone.code}>
                                {zone.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="supervisor-incidents__list">
                {incidents.length === 0 ? (
                    <div className="supervisor-empty-message">
                        <em>{t('supervisor.noIncidents')}</em>
                    </div>
                ) : (
                    incidents.map((incident) => {
                        const badgeClass = INCIDENT_STATUS_BADGE[incident.status] || '';
                        const canAssign = incident.status !== 'resolved';
                        const canResolve = incident.status !== 'resolved';

                        return (
                            <article key={incident._id} className="incident-card">
                                <div className="incident-card__top">
                                    <div>
                                        <h2>{t(`supervisor.incidentTypes.${incident.type}`)}</h2>
                                        <p className="incident-card__meta">
                                            {incident.zoneLabel || incident.parkZoneCode}
                                            {' · '}
                                            {formatIncidentDate(incident.createdAt, i18n.language)}
                                        </p>
                                    </div>
                                    <span className={`incident-badge ${badgeClass}`}>
                                        {t(`supervisor.incidentStatus.${incident.status}`)}
                                    </span>
                                </div>

                                <p className="incident-card__description">{incident.description}</p>

                                {incident.assignedOfficerId && (
                                    <p className="incident-card__assigned">
                                        {t('supervisor.assignedOfficer')}:{' '}
                                        <strong>{incident.assignedOfficerId.name}</strong>
                                        {incident.assignedOfficerId.phoneNumber
                                            ? ` (${incident.assignedOfficerId.phoneNumber})`
                                            : ''}
                                    </p>
                                )}

                                {incident.status === 'resolved' && incident.resolutionNotes && (
                                    <p className="incident-card__resolution">
                                        {t('supervisor.resolutionNotes')}: {incident.resolutionNotes}
                                    </p>
                                )}

                                <div className="incident-card__actions">
                                    {canAssign && (
                                        <button
                                            type="button"
                                            className="incident-btn incident-btn--secondary"
                                            onClick={() => setAssignTarget(incident)}
                                        >
                                            <UserPlus size={16} />
                                            {incident.status === 'assigned'
                                                ? t('supervisor.reassignOfficer')
                                                : t('supervisor.assignOfficer')}
                                        </button>
                                    )}
                                    {canResolve && (
                                        <button
                                            type="button"
                                            className="incident-btn incident-btn--success"
                                            onClick={() => setResolveTarget(incident)}
                                        >
                                            <CheckCircle2 size={16} />
                                            {t('supervisor.resolveIncident')}
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            <CreateIncidentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreate}
                assignedZones={data?.assignedZones || []}
                defaultZone={defaultZone}
                isSaving={createMutation.isPending}
                t={t}
            />

            <AssignIncidentModal
                isOpen={Boolean(assignTarget)}
                onClose={() => setAssignTarget(null)}
                incident={assignTarget}
                officers={assignOfficers}
                onSubmit={handleAssign}
                isSaving={assignMutation.isPending}
                t={t}
            />

            <ResolveIncidentModal
                isOpen={Boolean(resolveTarget)}
                onClose={() => setResolveTarget(null)}
                incident={resolveTarget}
                onSubmit={handleResolve}
                isSaving={resolveMutation.isPending}
                t={t}
            />
        </div>
    );
};

export default SupervisorIncidents;
