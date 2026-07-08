import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getParkZones } from '../../api/api';
import { queryKeys } from '../../api/queryKeys';

export const useParkZonesQuery = (token, options = {}) =>
    useQuery({
        queryKey: queryKeys.parkZones(token),
        queryFn: () => getParkZones(token),
        enabled: Boolean(token),
        ...options,
    });

export const useInvalidateParkZones = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['parkZones'] });
};
