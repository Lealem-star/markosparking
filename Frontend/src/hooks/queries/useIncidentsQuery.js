import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    assignIncident,
    createIncident,
    getIncidents,
    resolveIncident,
} from '../../api/api';
import { queryKeys } from '../../api/queryKeys';

export const useIncidentsQuery = (token, filters = {}, options = {}) =>
    useQuery({
        queryKey: queryKeys.incidents(token, filters),
        queryFn: () => getIncidents(token, filters),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });

export const useCreateIncidentMutation = (token, filters = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body) => createIncident(body, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents', token] });
        },
    });
};

export const useAssignIncidentMutation = (token, filters = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ incidentId, officerId }) =>
            assignIncident(incidentId, { officerId }, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents', token] });
        },
    });
};

export const useResolveIncidentMutation = (token, filters = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ incidentId, resolutionNotes }) =>
            resolveIncident(incidentId, { resolutionNotes }, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['incidents', token] });
        },
    });
};
