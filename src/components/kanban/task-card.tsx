'use client'

import { useTransition } from 'react'
import { Circle, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { updateTaskStatus, type TaskStatus } from '@/app/actions/tasks'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface Task {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    created_at: string
}

interface TaskCardProps {
    task: Task
    projectId: string
}

const statusConfig: Record<TaskStatus, { label: string; icon: React.ElementType; badge: string }> = {
    todo: {
        label: 'To Do',
        icon: Circle,
        badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    },
    done: {
        label: 'Done',
        icon: CheckCircle2,
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    },
}

export function TaskCard({ task, projectId }: TaskCardProps) {
    const [isPending, startTransition] = useTransition()
    const config = statusConfig[task.status]
    const Icon = config.icon

    function handleStatusChange(newStatus: string) {
        startTransition(async () => {
            await updateTaskStatus(task.id, newStatus as TaskStatus, projectId)
        })
    }

    return (
        <Card className={`group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-border/60 ${isPending ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        {isPending ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                        )}
                        <span className="text-sm font-medium leading-snug">{task.title}</span>
                    </div>
                </div>
            </CardHeader>

            {task.description && (
                <CardContent className="pb-3 pt-0 px-4">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {task.description}
                    </p>
                </CardContent>
            )}

            <CardContent className="pb-3 pt-0 px-4">
                <Select
                    value={task.status}
                    onValueChange={handleStatusChange}
                    disabled={isPending}
                >
                    <SelectTrigger className={`h-7 w-full text-xs border rounded-full px-3 ${config.badge}`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(statusConfig) as TaskStatus[]).map((s) => {
                            const { label, icon: SIcon } = statusConfig[s]
                            return (
                                <SelectItem key={s} value={s} className="text-xs">
                                    <div className="flex items-center gap-2">
                                        <SIcon className="h-3 w-3" />
                                        {label}
                                    </div>
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    )
}
