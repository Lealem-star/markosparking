import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsers } from '../../api/api';
import { queryKeys } from '../../api/queryKeys';

export const useUsersQuery = (token, options = {}) =>
    useQuery({
        queryKey: queryKeys.users(token),
        queryFn: () => getUsers(token),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });

export const useInvalidateUsers = () => {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['users'] });
};
