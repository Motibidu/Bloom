import * as React from 'react'
import { Card, CardContent } from '@/components/ui/shadcn/card'
import { cn } from '@/lib/utils'

interface DataCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: { value: number; label: string }
  className?: string
}

export function DataCard({ title, value, description, icon, trend, className }: DataCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-base font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-4xl font-bold text-foreground leading-none">{value}</p>
            {description && (
              <p className="text-base text-muted-foreground pt-1">{description}</p>
            )}
            {trend && (
              <p className={cn(
                'text-base font-medium pt-1',
                trend.value >= 0 ? 'text-green-600' : 'text-destructive'
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
