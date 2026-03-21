import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  value: string | number
  label: string
  accent?: boolean
}

export function StatCard({ value, label, accent }: StatCardProps) {
  return (
    <Card className="flex-1">
      <CardContent>
        <div
          className={cn(
            'font-(family-name:--font-outfit) text-xl font-medium',
            accent ? 'text-[var(--color-a-voir)]' : 'text-(--foreground)',
          )}
        >
          {value}
        </div>
        <div className="mt-0.5 text-[11px] text-(--muted-foreground) uppercase tracking-[0.06em] font-medium">
          {label}
        </div>
      </CardContent>
    </Card>
  )
}
