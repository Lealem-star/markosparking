import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTransactions, resolveFlaggedCarRecord } from '../../api/api';
import { queryKeys } from '../../api/queryKeys';

export const useTransactionsQuery = (token, filters = {}, options = {}) =>
    useQuery({
        queryKey: queryKeys.transactions(token, filters),
        queryFn: () => getTransactions(token, filters),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });

export const useResolveFlaggedCarMutation = (token) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ carId, ...body }) => resolveFlaggedCarRecord(carId, body, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['flaggedCars', token] });
            queryClient.invalidateQueries({ queryKey: ['transactions', token] });
            queryClient.invalidateQueries({ queryKey: ['parkedCars'] });
        },
    });
};
