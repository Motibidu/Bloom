import { Skeleton } from '@/components/ui/shadcn/skeleton'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="불러오는 중"
      className={cn(
        'inline-block w-8 h-8 rounded-full border-4 border-border border-t-primary animate-spin',
        className
      )}
    />
  )
}

export function FullPageLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner className="w-12 h-12" />
        <p className="text-lg text-muted-foreground">불러오는 중…</p>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
