import * as React from 'react'
import { Button } from '@/components/ui/shadcn/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
      className
    )}>
      {icon && (
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-lg text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {action && (
        <Button size="lg" className="mt-2 min-h-12 text-lg px-8" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
