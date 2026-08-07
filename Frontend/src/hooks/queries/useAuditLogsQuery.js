import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../../api/auditLogApi';
import { queryKeys } from '../../api/queryKeys';

export const useAuditLogsQuery = (token, filters = {}, options = {}) =>
    useQuery({
        queryKey: queryKeys.auditLogs(token, filters),
        queryFn: () => getAuditLogs(token, filters),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });
