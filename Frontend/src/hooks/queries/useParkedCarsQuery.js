import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getParkedCars, getDailyStats } from '../../api/api';
import { queryKeys } from '../../api/queryKeys';

export const useParkedCarsQuery = (token, params = {}, options = {}) =>
    useQuery({
        queryKey: queryKeys.parkedCars(token, params),
        queryFn: () => getParkedCars(token, params),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });

export const useDailyStatsQuery = (token, date, options = {}) =>
    useQuery({
        queryKey: queryKeys.dailyStats(token, date),
        queryFn: () => getDailyStats(token, date),
        enabled: Boolean(token) && Boolean(date) && options.enabled !== false,
        ...options,
    });

export const useInvalidateParkingQueries = () => {
    const queryClient = useQueryClient();

    return {
        invalidateParkedCars: () => queryClient.invalidateQueries({ queryKey: ['parkedCars'] }),
        invalidateDailyStats: () => queryClient.invalidateQueries({ queryKey: ['dailyStats'] }),
        invalidateAll: () => {
            queryClient.invalidateQueries({ queryKey: ['parkedCars'] });
            queryClient.invalidateQueries({ queryKey: ['dailyStats'] });
        },
    };
};
