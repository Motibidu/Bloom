import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

type ReportTargetType = 'CHECKIN' | 'COMMENT'
type ReasonType = 'SPAM' | 'INAPPROPRIATE' | 'ABUSE' | 'OTHER'

interface CreateReportRequest {
  targetType: ReportTargetType
  targetId: number
  reason: ReasonType
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (data: CreateReportRequest) =>
      api.post('/reports', data),
  })
}
