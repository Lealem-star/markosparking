import { useQuery } from '@tanstack/react-query';
import { getFinanceAuditLogs } from '../../api/auditLogApi';
import { queryKeys } from '../../api/queryKeys';

export const useFinanceAuditLogsQuery = (token, filters = {}, options = {}) =>
    useQuery({
        queryKey: queryKeys.financeAuditLogs(token, filters),
        queryFn: () => getFinanceAuditLogs(token, filters),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });
