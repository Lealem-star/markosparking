import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    finishAttendanceSession,
    getAttendanceSession,
    updateAttendanceStatus,
} from '../../api/api';
import { queryKeys } from '../../api/queryKeys';
import { applyOfficerStatusUpdate, DEFAULT_ATTENDANCE_SESSION } from '../../pages/supervisor/attendanceUtils';

export const useAttendanceSessionQuery = (token, date, session = DEFAULT_ATTENDANCE_SESSION, options = {}) =>
    useQuery({
        queryKey: queryKeys.attendance(token, date, session),
        queryFn: () => getAttendanceSession(token, { date, session }),
        enabled: Boolean(token) && options.enabled !== false,
        ...options,
    });

export const useUpdateAttendanceStatusMutation = (token, date, session = DEFAULT_ATTENDANCE_SESSION) => {
    const queryClient = useQueryClient();
    const queryKey = queryKeys.attendance(token, date, session);

    return useMutation({
        mutationFn: ({ officerId, status }) =>
            updateAttendanceStatus(officerId, { dateKey: date, session, status }, token),
        onMutate: async ({ officerId, status }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);

            if (previous) {
                queryClient.setQueryData(
                    queryKey,
                    applyOfficerStatusUpdate(previous, officerId, status)
                );
            }

            return { previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(queryKey, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
};

export const useFinishAttendanceMutation = (token, date, session = DEFAULT_ATTENDANCE_SESSION) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (markRemainingAbsent) =>
            finishAttendanceSession({ dateKey: date, session, markRemainingAbsent }, token),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.attendance(token, date, session) });
        },
    });
};
