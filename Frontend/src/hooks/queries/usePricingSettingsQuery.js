import { useQuery } from '@tanstack/react-query';
import { getPricingSettings } from '../../api/api';
import { queryKeys } from '../../api/queryKeys';

export const usePricingSettingsQuery = (options = {}) =>
    useQuery({
        queryKey: queryKeys.pricingSettings(),
        queryFn: getPricingSettings,
        ...options,
    });
