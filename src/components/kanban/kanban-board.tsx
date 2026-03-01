'use client'

import { useState, useTransition } from 'react'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import { updateTaskStatus, type TaskStatus } from '@/app/actions/tasks'
import { KanbanColumn } from './kanban-column'
import { DragOverlayCard, type Task } from './task-card'
import { TaskDetailSheet } from './task-detail-sheet'

interface Column {
    id: TaskStatus
    label: string
    icon: React.ElementType
    accent: string
    headerBorder: string
}

const COLUMNS: Column[] = [
    {
        id: 'todo',
        label: 'To Do',
        icon: Circle,
        accent: 'text-zinc-400',
        headerBorder: 'border-zinc-500/30',
    },
    {
        id: 'in_progress',
        label: 'In Progress',
        icon: Clock,
        accent: 'text-blue-400',
        headerBorder: 'border-blue-500/30',
    },
    {
        id: 'done',
        label: 'Done',
        icon: CheckCircle2,
        accent: 'text-emerald-400',
        headerBorder: 'border-emerald-500/30',
    },
]

interface KanbanBoardProps {
    initialTasks: Task[]
    projectId: string
}

export function KanbanBoard({ initialTasks, projectId }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [activeTask, setActiveTask] = useState<Task | null>(null)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [, startTransition] = useTransition()

    // Require the user to move the pointer 8px before a drag starts,
    // so clicks and taps still register on the card.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    )

    function handleDragStart(event: DragStartEvent) {
        const task = tasks.find((t) => t.id === event.active.id)
        if (task) setActiveTask(task)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveTask(null)

        if (!over) return

        const newStatus = over.id as TaskStatus
        const task = tasks.find((t) => t.id === active.id)
        if (!task || task.status === newStatus) return

        // Immediately move the card to the new column in local state
        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        )

        // Persist in the background — revalidatePath will sync server state
        startTransition(async () => {
            await updateTaskStatus(task.id, newStatus, projectId)
        })
    }

    function handleCardClick(task: Task) {
        setSelectedTask(task)
        setSheetOpen(true)
    }

    function handleTaskUpdate(updatedTask: Task) {
        setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        )
    }

    const tasksByStatus = tasks.reduce<Record<TaskStatus, Task[]>>(
        (acc, task) => {
            acc[task.status].push(task)
            return acc
        },
        { todo: [], in_progress: [], done: [] }
    )

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            tasks={tasksByStatus[col.id]}
                            projectId={projectId}
                            onCardClick={handleCardClick}
                        />
                    ))}
                </div>

                {/* Drag ghost — rendered in a portal above everything */}
                <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
                    {activeTask ? <DragOverlayCard task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>

            {/* Task detail sheet — only mount when a task is selected */}
            {selectedTask && (
                <TaskDetailSheet
                    key={selectedTask.id}
                    task={selectedTask}
                    projectId={projectId}
                    open={sheetOpen}
                    onOpenChange={(o) => {
                        setSheetOpen(o)
                        if (!o) setSelectedTask(null)
                    }}
                    onTaskUpdate={handleTaskUpdate}
                />
            )}
        </>
    )
}
