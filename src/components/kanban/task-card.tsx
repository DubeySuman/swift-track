'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Circle, Clock, CheckCircle2, GripVertical } from 'lucide-react'
import type { TaskStatus } from '@/app/actions/tasks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export interface Task {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    created_at: string
}

const statusIcons: Record<TaskStatus, React.ElementType> = {
    todo: Circle,
    in_progress: Clock,
    done: CheckCircle2,
}

interface TaskCardProps {
    task: Task
    onClick: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    })

    const Icon = statusIcons[task.status]

    return (
        <Card
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform) }}
            className={`group relative border-border/60 transition-all duration-200 select-none
                ${isDragging
                    ? 'opacity-40 cursor-grabbing'
                    : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                }`}
            onClick={isDragging ? undefined : onClick}
        >
            <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                        <span className="text-sm font-medium leading-snug">{task.title}</span>
                    </div>
                    {/* Drag handle — appears on hover, stops click propagation */}
                    <div
                        {...listeners}
                        {...attributes}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground p-0.5 -mr-1 rounded"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>
                </div>
            </CardHeader>

            {task.description && (
                <CardContent className="pb-3 pt-0 px-4">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {task.description}
                    </p>
                </CardContent>
            )}
        </Card>
    )
}

/** Rendered inside DragOverlay — the "ghost" card that follows the cursor with a tilt effect */
export function DragOverlayCard({ task }: { task: Task }) {
    const Icon = statusIcons[task.status]

    return (
        <Card className="shadow-2xl border-primary/30 rotate-2 scale-[1.04] cursor-grabbing bg-card">
            <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <span className="text-sm font-medium leading-snug">{task.title}</span>
                </div>
            </CardHeader>
            {task.description && (
                <CardContent className="pb-3 pt-0 px-4">
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                </CardContent>
            )}
        </Card>
    )
}
