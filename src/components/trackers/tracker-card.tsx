'use client'

import { useState, useTransition } from 'react'
import { Trash2, Pencil, CheckCircle2, Timer, ListChecks } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteTracker, updateProgress, type Tracker, type MetricType } from '@/app/actions/trackers'

// ─── Metric type config ───────────────────────────────────────────────────────

const METRIC_CONFIG: Record<
    MetricType,
    { icon: React.ElementType; color: string; bg: string; border: string; suffix: string }
> = {
    Percentage: {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/25',
        suffix: '%',
    },
    Hours: {
        icon: Timer,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/25',
        suffix: 'hrs',
    },
    Tasks: {
        icon: ListChecks,
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/25',
        suffix: 'tasks',
    },
}

// ─── Progress bar color based on completion ───────────────────────────────────

function progressBarClass(pct: number): string {
    if (pct >= 100) return '[&>div]:bg-emerald-500'
    if (pct >= 60) return '[&>div]:bg-blue-500'
    if (pct >= 30) return '[&>div]:bg-amber-500'
    return '[&>div]:bg-rose-500'
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
    tracker: Tracker
}

export function MetricCard({ tracker }: MetricCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [inputValue, setInputValue] = useState(String(tracker.current_value))
    const [isPending, startTransition] = useTransition()

    const cfg = METRIC_CONFIG[tracker.metric_type] ?? METRIC_CONFIG.Percentage
    const MetricIcon = cfg.icon

    const pct = tracker.target_value > 0
        ? Math.min(100, Math.round((tracker.current_value / tracker.target_value) * 100))
        : 0

    const isComplete = pct >= 100

    const handleSaveProgress = () => {
        const parsed = parseFloat(inputValue)
        if (isNaN(parsed) || parsed < 0) {
            toast.error('Enter a valid non-negative number.')
            return
        }
        startTransition(async () => {
            const res = await updateProgress(tracker.id, parsed)
            if (res.error) {
                toast.error('Update failed: ' + res.error)
            } else {
                toast.success('Progress updated!')
                setIsEditing(false)
            }
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            const res = await deleteTracker(tracker.id)
            if (res.error) {
                toast.error('Delete failed: ' + res.error)
            } else {
                toast.success(`"${tracker.metric_name}" removed.`)
            }
        })
    }

    return (
        <Card
            className={`group relative border ${cfg.border} bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden`}
        >
            {/* Completion shimmer */}
            {isComplete && (
                <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
            )}

            {/* Left accent stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bg}`} />

            <CardContent className="pl-5 pr-4 pt-4 pb-4 space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`rounded-md p-1.5 shrink-0 ${cfg.bg}`}>
                            <MetricIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                                {tracker.project_name}
                            </p>
                            <p className="text-sm font-semibold truncate leading-snug">
                                {tracker.metric_name}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons — always visible, subtle until hover */}
                    <div className="flex items-center gap-1 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setIsEditing(!isEditing)}
                            disabled={isPending}
                            aria-label="Edit progress"
                        >
                            <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={handleDelete}
                            disabled={isPending}
                            aria-label="Delete tracker"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                    <Progress
                        value={pct}
                        className={`h-2 bg-muted/60 [&>div]:transition-all [&>div]:duration-700 ${progressBarClass(pct)}`}
                    />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {tracker.current_value} / {tracker.target_value} {cfg.suffix}
                        </span>
                        <span className={`text-xs font-bold tabular-nums ${isComplete ? 'text-emerald-500' : cfg.color}`}>
                            {isComplete ? '✓ Done' : `${pct}%`}
                        </span>
                    </div>
                </div>

                {/* Inline edit row */}
                {isEditing && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                        <Input
                            type="number"
                            min="0"
                            step="any"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveProgress()}
                            className="h-7 text-xs flex-1"
                            placeholder="New value…"
                            autoFocus
                        />
                        <Button
                            size="sm"
                            className="h-7 text-xs px-3"
                            onClick={handleSaveProgress}
                            disabled={isPending}
                        >
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs px-2"
                            onClick={() => { setIsEditing(false); setInputValue(String(tracker.current_value)) }}
                        >
                            ✕
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
