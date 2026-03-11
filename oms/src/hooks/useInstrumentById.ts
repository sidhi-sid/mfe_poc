import { useQuery } from '@tanstack/react-query'
import { fetchInstrumentById } from '@/api/client'

/**
 * Fetches a single instrument by ID. Only runs when id is present (enabled: !!id).
 * Query key: ['instrument', id] for caching.
 */
export function useInstrumentById(id: string | undefined) {
  const query = useQuery({
    queryKey: ['instrument', id],
    queryFn: () => fetchInstrumentById(id!),
    enabled: !!id,
  })

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error != null
      ? (query.error instanceof Error ? query.error.message : 'Failed to load instrument')
      : null,
  }
}
