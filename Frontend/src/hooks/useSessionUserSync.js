import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserProfile } from '../api/userApi';
import { queryKeys } from '../api/queryKeys';
import { setUser } from '../store';
import { useCurrentUser } from './useAuth';

const PROFILE_FIELDS = [
    'name',
    'phoneNumber',
    'type',
    'parkZoneCode',
    'language',
    'profilePhoto',
    'priceLevel',
    'isActive',
];

const hasProfileChanges = (stored, fresh) =>
    PROFILE_FIELDS.some((field) => stored?.[field] !== fresh?.[field]);

export const useSessionUserSync = () => {
    const user = useCurrentUser();
    const dispatch = useDispatch();
    const token = user?.token;
    const userRef = useRef(user);
    userRef.current = user;

    const { data: profile } = useQuery({
        queryKey: queryKeys.sessionUser(token),
        queryFn: () => getCurrentUserProfile(token),
        enabled: Boolean(token),
        staleTime: 30_000,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        const stored = userRef.current;
        if (!profile || !stored?.token) return;
        if (!hasProfileChanges(stored, profile)) return;
        dispatch(setUser({ ...stored, ...profile, token: stored.token }));
    }, [profile, dispatch]);
};
