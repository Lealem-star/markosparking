import { useQuery } from '@tanstack/react-query';
import { getApiError } from '../api/client';

export const useReportQuery = (queryKey, queryFn, { enabled = true } = {}) => {
    const query = useQuery({
        queryKey,
        queryFn,
        enabled,
    });

    return {
        data: query.data ?? null,
        loading: query.isLoading || query.isFetching,
        error: query.error ? getApiError(query.error, 'Failed to load report') : '',
        setError: () => {},
        load: query.refetch,
        refetch: query.refetch,
    };
};
