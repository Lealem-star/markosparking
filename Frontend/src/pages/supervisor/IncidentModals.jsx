import React, { useEffect, useState } from 'react';
import { getApiError } from '../../api/client';
import ModalShell from '../../components/ui/ModalShell';
import { INCIDENT_TYPES } from './incidentUtils';

const FormField = ({ label, children }) => (
    <label className="incident-form-field">
        <span>{label}</span>
        {children}
    </label>
);

export const CreateIncidentModal = ({
    isOpen,
    onClose,
    onSubmit,
    assignedZones = [],
    defaultZone = '',
    isSaving,
    t,
}) => {
    const [type, setType] = useState(INCIDENT_TYPES[0]);
    const [description, setDescription] = useState('');
    const [parkZoneCode, setParkZoneCode] = useState(defaultZone);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setType(INCIDENT_TYPES[0]);
        setDescription('');
        setParkZoneCode(defaultZone);
        setError('');
    }, [isOpen, defaultZone]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!description.trim()) {
            setError(t('supervisor.incidentDescriptionRequired'));
            return;
        }
        if (!parkZoneCode) {
            setError(t('supervisor.incidentZoneRequired'));
            return;
        }

        setError('');
        try {
            await onSubmit({ type, description: description.trim(), parkZoneCode });
            onClose();
        } catch (submitError) {
            setError(getApiError(submitError, t('supervisor.incidentCreateFailed')));
        }
    };

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={t('supervisor.createIncident')}
            maxWidth="520px"
            footer={(
                <div className="incident-modal-actions">
                    <button type="button" className="incident-btn incident-btn--ghost" onClick={onClose} disabled={isSaving}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" form="create-incident-form" className="incident-btn incident-btn--primary" disabled={isSaving}>
                        {t('supervisor.createIncident')}
                    </button>
                </div>
            )}
        >
            <form id="create-incident-form" className="incident-form" onSubmit={handleSubmit}>
                {error && <div className="supervisor-alert supervisor-alert--error">{error}</div>}

                <FormField label={t('supervisor.incidentType')}>
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        {INCIDENT_TYPES.map((item) => (
                            <option key={item} value={item}>
                                {t(`supervisor.incidentTypes.${item}`)}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label={t('admin.parkZoneCode')}>
                    <select
                        value={parkZoneCode}
                        onChange={(e) => setParkZoneCode(e.target.value)}
                        required
                    >
                        <option value="">{t('supervisor.selectZone')}</option>
                        {assignedZones.map((zone) => (
                            <option key={zone.code} value={zone.code}>
                                {zone.label}
                            </option>
                        ))}
                    </select>
                </FormField>

                <FormField label={t('supervisor.incidentDescription')}>
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('supervisor.incidentDescriptionPlaceholder')}
                    />
                </FormField>
            </form>
        </ModalShell>
    );
};

export const AssignIncidentModal = ({
    isOpen,
    onClose,
    incident,
    officers = [],
    onSubmit,
    isSaving,
    t,
}) => {
    const [officerId, setOfficerId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setOfficerId('');
        setError('');
    }, [isOpen, incident?._id]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!officerId) {
            setError(t('supervisor.incidentOfficerRequired'));
            return;
        }

        setError('');
        try {
            await onSubmit({ incidentId: incident._id, officerId });
            onClose();
        } catch (submitError) {
            setError(getApiError(submitError, t('supervisor.incidentAssignFailed')));
        }
    };

    if (!incident) return null;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={t('supervisor.assignOfficer')}
            maxWidth="480px"
            footer={(
                <div className="incident-modal-actions">
                    <button type="button" className="incident-btn incident-btn--ghost" onClick={onClose} disabled={isSaving}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" form="assign-incident-form" className="incident-btn incident-btn--primary" disabled={isSaving}>
                        {t('supervisor.assignOfficer')}
                    </button>
                </div>
            )}
        >
            <form id="assign-incident-form" className="incident-form" onSubmit={handleSubmit}>
                {error && <div className="supervisor-alert supervisor-alert--error">{error}</div>}

                <p className="incident-modal-summary">
                    <strong>{t(`supervisor.incidentTypes.${incident.type}`)}</strong>
                    <span>{incident.zoneLabel || incident.parkZoneCode}</span>
                </p>

                <FormField label={t('supervisor.selectOfficer')}>
                    {officers.length === 0 ? (
                        <p className="incident-modal-empty">{t('supervisor.noOfficersInZone')}</p>
                    ) : (
                        <select value={officerId} onChange={(e) => setOfficerId(e.target.value)} required>
                            <option value="">{t('supervisor.selectOfficer')}</option>
                            {officers.map((officer) => (
                                <option key={officer._id} value={officer._id}>
                                    {officer.name} ({officer.phoneNumber})
                                </option>
                            ))}
                        </select>
                    )}
                </FormField>
            </form>
        </ModalShell>
    );
};

export const ResolveIncidentModal = ({
    isOpen,
    onClose,
    incident,
    onSubmit,
    isSaving,
    t,
}) => {
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        setResolutionNotes('');
        setError('');
    }, [isOpen, incident?._id]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        try {
            await onSubmit({ incidentId: incident._id, resolutionNotes: resolutionNotes.trim() });
            onClose();
        } catch (submitError) {
            setError(getApiError(submitError, t('supervisor.incidentResolveFailed')));
        }
    };

    if (!incident) return null;

    return (
        <ModalShell
            isOpen={isOpen}
            onClose={onClose}
            title={t('supervisor.resolveIncident')}
            maxWidth="480px"
            footer={(
                <div className="incident-modal-actions">
                    <button type="button" className="incident-btn incident-btn--ghost" onClick={onClose} disabled={isSaving}>
                        {t('common.cancel')}
                    </button>
                    <button type="submit" form="resolve-incident-form" className="incident-btn incident-btn--primary" disabled={isSaving}>
                        {t('supervisor.resolveIncident')}
                    </button>
                </div>
            )}
        >
            <form id="resolve-incident-form" className="incident-form" onSubmit={handleSubmit}>
                {error && <div className="supervisor-alert supervisor-alert--error">{error}</div>}

                <p className="incident-modal-summary">
                    <strong>{t(`supervisor.incidentTypes.${incident.type}`)}</strong>
                    <span>{incident.description}</span>
                </p>

                <FormField label={t('supervisor.resolutionNotes')}>
                    <textarea
                        rows={4}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder={t('supervisor.resolutionNotesPlaceholder')}
                    />
                </FormField>
            </form>
        </ModalShell>
    );
};
