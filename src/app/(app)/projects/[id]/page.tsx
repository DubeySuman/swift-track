import { notFound } from 'next/navigation'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { TaskCard } from '@/components/kanban/task-card'
import { AddTaskDialog } from '@/components/kanban/add-task-dialog'
import type { TaskStatus } from '@/app/actions/tasks'

interface Column {
    id: TaskStatus
    label: string
    icon: React.ElementType
    accent: string
    headerText: string
}

const COLUMNS: Column[] = [
    {
        id: 'todo',
        label: 'To Do',
        icon: Circle,
        accent: 'text-zinc-400',
        headerText: 'border-zinc-500/30',
    },
    {
        id: 'in_progress',
        label: 'In Progress',
        icon: Clock,
        accent: 'text-blue-400',
        headerText: 'border-blue-500/30',
    },
    {
        id: 'done',
        label: 'Done',
        icon: CheckCircle2,
        accent: 'text-emerald-400',
        headerText: 'border-emerald-500/30',
    },
]

interface Task {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    created_at: string
}

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch project and tasks in parallel
    const [{ data: project }, { data: tasks }] = await Promise.all([
        supabase
            .from('projects')
            .select('id, name, description')
            .eq('id', id)
            .single(),
        supabase
            .from('tasks')
            .select('id, title, description, status, created_at')
            .eq('project_id', id)
            .order('created_at', { ascending: true }),
    ])

    if (!project) notFound()

    const tasksByStatus = (tasks ?? []).reduce<Record<TaskStatus, Task[]>>(
        (acc, task) => {
            const s = task.status as TaskStatus
            if (!acc[s]) acc[s] = []
            acc[s].push(task as Task)
            return acc
        },
        { todo: [], in_progress: [], done: [] }
    )

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Project Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
                {COLUMNS.map((col) => {
                    const Icon = col.icon
                    const columnTasks = tasksByStatus[col.id] ?? []

                    return (
                        <div
                            key={col.id}
                            className="flex flex-col gap-3 rounded-xl bg-muted/30 border border-border/50 p-3"
                        >
                            {/* Column Header */}
                            <div className={`flex items-center justify-between pb-2 border-b ${col.headerText}`}>
                                <div className="flex items-center gap-2">
                                    <Icon className={`h-4 w-4 ${col.accent}`} />
                                    <span className="text-sm font-semibold">{col.label}</span>
                                    <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        {columnTasks.length}
                                    </span>
                                </div>
                                {/* Only "To Do" column gets the Add Task button */}
                                {col.id === 'todo' && <AddTaskDialog projectId={id} />}
                            </div>

                            {/* Task Cards */}
                            <div className="flex flex-col gap-2 min-h-[120px]">
                                {columnTasks.length === 0 ? (
                                    <div className="flex items-center justify-center h-[80px] rounded-lg border border-dashed border-border/40 text-xs text-muted-foreground">
                                        No tasks here
                                    </div>
                                ) : (
                                    columnTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} projectId={id} />
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
