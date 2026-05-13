import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function useMyCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['my-calendar', year, month],
    queryFn: () => api.get('/checkins/my/calendar', { params: { year, month } }).then(r => r.data),
  })
}

export function useMyCheckins(date: string) {
  return useQuery({
    queryKey: ['my-checkins', date],
    queryFn: () => api.get('/checkins/my', { params: { date } }).then(r => r.data),
    enabled: !!date,
  })
}

export function useMyCategoryStats(year: number, month: number) {
  return useQuery({
    queryKey: ['my-stats', year, month],
    queryFn: () => api.get('/checkins/my/stats', { params: { year, month } }).then(r => r.data),
  })
}

export interface MonthlyReportResponse {
  year: number
  month: number
  totalDays: number
  totalCheckins: number
  categoryStats: Record<string, number>
  activeDays: number[]
  mostActiveCategory: string | null
  currentStreak: number
  longestStreak: number
}

export function useMonthlyReport(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly-report', year, month],
    queryFn: () =>
      api
        .get<MonthlyReportResponse>(`/users/me/monthly-report`, { params: { year, month } })
        .then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}
