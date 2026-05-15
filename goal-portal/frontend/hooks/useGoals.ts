import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get('/goals/mine');
      return data;
    },
  });
}
