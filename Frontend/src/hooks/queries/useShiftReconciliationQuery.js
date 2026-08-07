import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getShiftReconciliationPreview,
    getShiftReconciliations,
    reviewShiftReconciliation,
    submitShiftReconciliation,
} from '../../api/shiftReconciliationApi';
import { queryKeys } from '../../api/queryKeys';

export const useShiftReconciliationsQuery = (token, filters = {}, options = {}) =>
    useQuery({
        queryKey: queryKeys.shiftReconciliations(token, filters),
        queryFn: () => getShiftReconciliations(token, filters),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });

export const useShiftReconciliationPreviewQuery = (token, params = {}, options = {}) =>
    useQuery({
        queryKey: ['shiftReconciliationPreview', token, params.date, params.session, params.parkZoneCode],
        queryFn: () => getShiftReconciliationPreview(token, params),
        enabled: Boolean(token)
            && Boolean(params.date)
            && Boolean(params.session)
            && Boolean(params.parkZoneCode)
            && options.enabled !== false,
        ...options,
    });

export const useSubmitShiftReconciliationMutation = (token) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body) => submitShiftReconciliation(body, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shiftReconciliations', token] });
            queryClient.invalidateQueries({ queryKey: ['shiftReconciliationPreview', token] });
        },
    });
};

export const useReviewShiftReconciliationMutation = (token) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...body }) => reviewShiftReconciliation(id, body, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shiftReconciliations', token] });
        },
    });
};
