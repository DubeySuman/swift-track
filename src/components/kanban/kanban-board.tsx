'use client'

import { useState, useTransition, useRef } from 'react'
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
import { TaskFullView } from './task-full-view'

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
    const [fullViewOpen, setFullViewOpen] = useState(false)
    const [, startTransition] = useTransition()

    // Tracks when the sheet is being closed to open the full view,
    // so we don't clear selectedTask prematurely.
    const expandingRef = useRef(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    )

    // ── Drag handlers ──────────────────────────────────────────────────────

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

        setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        )

        startTransition(async () => {
            await updateTaskStatus(task.id, newStatus, projectId)
        })
    }

    // ── Card interaction ───────────────────────────────────────────────────

    function handleCardClick(task: Task) {
        setSelectedTask(task)
        setSheetOpen(true)
    }

    // Expand: close sheet → open full view without clearing selectedTask
    function handleExpand() {
        expandingRef.current = true
        setSheetOpen(false)
        setFullViewOpen(true)
    }

    function handleSheetOpenChange(open: boolean) {
        setSheetOpen(open)
        if (!open && !expandingRef.current) {
            setSelectedTask(null)
        }
        expandingRef.current = false
    }

    function handleFullViewOpenChange(open: boolean) {
        setFullViewOpen(open)
        if (!open) setSelectedTask(null)
    }

    // ── Task mutations ─────────────────────────────────────────────────────

    function handleTaskUpdate(updatedTask: Task) {
        setTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        )
        // Keep selectedTask in sync so re-opening the sheet shows fresh data
        setSelectedTask(updatedTask)
    }

    function handleTaskCreated(newTask: Task) {
        setTasks((prev) => [...prev, newTask])
    }

    function handleTaskDeleted(taskId: string) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
    }

    // ── Derived ────────────────────────────────────────────────────────────

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
                            onTaskCreated={handleTaskCreated}
                        />
                    ))}
                </div>

                <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
                    {activeTask ? <DragOverlayCard task={activeTask} /> : null}
                </DragOverlay>
            </DndContext>

            {/* Side sheet — compact quick-edit */}
            {selectedTask && (
                <TaskDetailSheet
                    key={selectedTask.id}
                    task={selectedTask}
                    projectId={projectId}
                    open={sheetOpen}
                    onOpenChange={handleSheetOpenChange}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDeleted={handleTaskDeleted}
                    onExpand={handleExpand}
                />
            )}

            {/* Full-view modal — document-like deep work */}
            {selectedTask && (
                <TaskFullView
                    key={`full-${selectedTask.id}`}
                    task={selectedTask}
                    projectId={projectId}
                    open={fullViewOpen}
                    onOpenChange={handleFullViewOpenChange}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDeleted={handleTaskDeleted}
                />
            )}
        </>
    )
}
