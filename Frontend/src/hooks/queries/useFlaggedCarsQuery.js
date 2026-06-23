import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getFlaggedCars } from '../../api/api';
import { queryKeys } from '../../api/queryKeys';

export const useFlaggedCarsQuery = (token, options = {}) =>
    useQuery({
        queryKey: queryKeys.flaggedCars(token),
        queryFn: () => getFlaggedCars(token),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });

export const useInvalidateFlaggedCars = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['flaggedCars'] });
};
