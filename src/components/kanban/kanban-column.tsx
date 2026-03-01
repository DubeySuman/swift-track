'use client'

import { useDroppable } from '@dnd-kit/core'
import type { TaskStatus } from '@/app/actions/tasks'
import { TaskCard, type Task } from './task-card'
import { AddTaskDialog } from './add-task-dialog'

interface Column {
    id: TaskStatus
    label: string
    icon: React.ElementType
    accent: string
    headerBorder: string
}

interface KanbanColumnProps {
    column: Column
    tasks: Task[]
    projectId: string
    onCardClick: (task: Task) => void
}

export function KanbanColumn({ column, tasks, projectId, onCardClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id })
    const Icon = column.icon

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col gap-3 rounded-xl border p-3 transition-all duration-200 ${isOver
                    ? 'bg-muted/60 border-primary/40 shadow-inner'
                    : 'bg-muted/30 border-border/50'
                }`}
        >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-2 border-b ${column.headerBorder}`}>
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${column.accent}`} />
                    <span className="text-sm font-semibold">{column.label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
                        {tasks.length}
                    </span>
                </div>
                {column.id === 'todo' && <AddTaskDialog projectId={projectId} />}
            </div>

            {/* Drop Zone + Cards */}
            <div className="flex flex-col gap-2 min-h-[120px]">
                {tasks.length === 0 ? (
                    <div
                        className={`flex items-center justify-center h-[80px] rounded-lg border border-dashed text-xs transition-all duration-200 ${isOver
                                ? 'border-primary/50 bg-primary/5 text-primary'
                                : 'border-border/40 text-muted-foreground'
                            }`}
                    >
                        {isOver ? '↓ Drop here' : 'No tasks yet'}
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onClick={() => onCardClick(task)}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
