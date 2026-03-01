import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import type { TaskStatus } from '@/app/actions/tasks'

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

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Project Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                )}
            </div>

            {/* Interactive Kanban Board — Client Component boundary */}
            <KanbanBoard
                initialTasks={(tasks ?? []) as Task[]}
                projectId={id}
            />
        </div>
    )
}
