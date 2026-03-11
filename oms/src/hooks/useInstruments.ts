import { useQuery } from '@tanstack/react-query'
import { fetchInstruments } from '@/api/client'
import instrumentsData from '@/data/instruments'

const queryKey = ['instruments'] as const

/**
 * Fetches instruments from the OMS API via TanStack Query.
 * Falls back to mock data on error. Same shape as before: instruments, loading, error, instrumentsSource.
 */
export function useInstruments() {
  const query = useQuery({
    queryKey,
    queryFn: fetchInstruments,
  })

  const instruments =
    query.data != null
      ? (query.data as typeof instrumentsData)
      : query.isError
        ? instrumentsData
        : []
  const error =
    query.error != null
      ? (query.error instanceof Error ? query.error.message : 'Unknown error')
      : null

  return {
    instruments,
    loading: query.isPending,
    error,
    instrumentsSource: query.isError ? 'mock' : query.data != null ? 'api' : 'api',
  }
}
