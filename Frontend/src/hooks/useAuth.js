import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store';

export const useCurrentUser = () => useSelector(selectCurrentUser);
