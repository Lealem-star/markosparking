import { QueryClient } from '@tanstack/react-query';

const shouldRetryQuery = (failureCount, error) => {
    if (error?.response?.status === 401) return false;
    return failureCount < 1;
};

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: shouldRetryQuery,
            refetchOnWindowFocus: false,
        },
    },
});
