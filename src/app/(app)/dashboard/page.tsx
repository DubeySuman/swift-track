import { LayoutDashboard, FolderOpen, CheckSquare, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch project count and task counts in parallel
    const [{ count: projectCount }, { data: tasks }] = await Promise.all([
        supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user!.id),
        supabase
            .from('tasks')
            .select('status')
            .eq('user_id', user!.id),
    ])

    const taskCounts = (tasks ?? []).reduce(
        (acc, t) => {
            if (t.status === 'todo') acc.todo++
            else if (t.status === 'in_progress') acc.in_progress++
            else if (t.status === 'done') acc.done++
            return acc
        },
        { todo: 0, in_progress: 0, done: 0 }
    )

    const stats = [
        {
            label: 'Projects',
            value: projectCount ?? 0,
            icon: FolderOpen,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
        },
        {
            label: 'To Do',
            value: taskCounts.todo,
            icon: CheckSquare,
            color: 'text-zinc-400',
            bg: 'bg-zinc-500/10',
        },
        {
            label: 'In Progress',
            value: taskCounts.in_progress,
            icon: Clock,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
        },
        {
            label: 'Done',
            value: taskCounts.done,
            icon: CheckSquare,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
        },
    ]

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of your projects and tasks
                    </p>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.label} className="border-border/60">
                            <CardHeader className="pb-2 pt-4 px-5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.label}
                                    </CardTitle>
                                    <div className={`rounded-md p-1.5 ${stat.bg}`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-5 pb-4">
                                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Quick-start hint if no projects yet */}
            {(projectCount ?? 0) === 0 && (
                <Card className="border-dashed border-border/60 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/40" />
                        <div>
                            <p className="font-medium">No projects yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Hit the <strong>+</strong> button in the sidebar to create your first project.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
