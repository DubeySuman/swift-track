import {
    LayoutDashboard,
    FolderOpen,
    CheckSquare,
    Clock,
    ArrowRight,
    Circle,
    Activity,
    TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getTrackers } from '@/app/actions/trackers'
import { MetricCard } from '@/components/trackers/tracker-card'
import { CreateTrackerDialog } from '@/components/trackers/create-tracker-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = 'todo' | 'in_progress' | 'done'

interface TaskRow {
    id: string
    title: string
    status: TaskStatus
    created_at: string
    project_id: string
}

interface ProjectRow {
    id: string
    name: string
    description: string | null
    created_at: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
    TaskStatus,
    { label: string; className: string; icon: React.ElementType }
> = {
    todo: {
        label: 'To Do',
        className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
        icon: Circle,
    },
    in_progress: {
        label: 'In Progress',
        className: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
        icon: Clock,
    },
    done: {
        label: 'Done',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        icon: CheckSquare,
    },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // 1. Project list (up to 6, most recent first)
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, description, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(6)

    const projectIds = (projects ?? []).map((p) => p.id)

    // 2. All tasks for those projects (for progress bars) + stat counts + recent tasks in parallel
    const [
        { data: projectTasks },
        { data: allTasks },
        { data: recentTasks },
    ] = await Promise.all([
        // tasks for the visible projects
        projectIds.length > 0
            ? supabase
                .from('tasks')
                .select('id, project_id, status')
                .in('project_id', projectIds)
            : Promise.resolve({ data: [] }),
        // all tasks for stat cards
        supabase.from('tasks').select('status').eq('user_id', user!.id),
        // 5 most recently created tasks (joined to project name)
        supabase
            .from('tasks')
            .select('id, title, status, created_at, project_id, projects(name)')
            .eq('user_id', user!.id)
            .order('created_at', { ascending: false })
            .limit(5),
    ])

    // Fetch trackers in parallel
    const trackers = await getTrackers()

    // ── Stat cards ────────────────────────────────────────────────────────────

    const taskCounts = (allTasks ?? []).reduce(
        (acc, t) => {
            if (t.status === 'todo') acc.todo++
            else if (t.status === 'in_progress') acc.in_progress++
            else if (t.status === 'done') acc.done++
            return acc
        },
        { todo: 0, in_progress: 0, done: 0 }
    )

    const statCards = [
        {
            label: 'Projects',
            value: (projects ?? []).length,
            icon: FolderOpen,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
        },
        {
            label: 'To Do',
            value: taskCounts.todo,
            icon: Circle,
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

    // ── Project progress ──────────────────────────────────────────────────────

    const tasksByProject = (projectTasks ?? []).reduce<
        Record<string, { total: number; done: number }>
    >((acc, t) => {
        if (!acc[t.project_id]) acc[t.project_id] = { total: 0, done: 0 }
        acc[t.project_id].total++
        if (t.status === 'done') acc[t.project_id].done++
        return acc
    }, {})

    const projectsWithProgress = (projects ?? []).map((p) => {
        const stats = tasksByProject[p.id] ?? { total: 0, done: 0 }
        const pct = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100)
        return { ...p, ...stats, pct }
    })

    // ─── Render ───────────────────────────────────────────────────────────────

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
                        Your projects and tasks at a glance
                    </p>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => {
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

            {/* ── Main two-column section ── */}
            {(projects ?? []).length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    {/* Left 60%: Recent Projects */}
                    <div className="lg:col-span-3 flex flex-col gap-3">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Recent Projects
                        </h2>
                        <div className="flex flex-col gap-3">
                            {projectsWithProgress.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="group block"
                                >
                                    <Card className="border-border/60 transition-all duration-200 hover:shadow-md hover:border-border group-hover:-translate-y-0.5">
                                        <CardContent className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                                                        {project.name}
                                                    </p>
                                                    {project.description && (
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-0.5" />
                                            </div>

                                            {/* Progress bar */}
                                            <div className="flex items-center gap-3">
                                                <Progress
                                                    value={project.pct}
                                                    className="h-1.5 flex-1 bg-muted [&>div]:bg-emerald-500 [&>div]:transition-all [&>div]:duration-500"
                                                />
                                                <span className="text-xs tabular-nums text-muted-foreground shrink-0 w-16 text-right">
                                                    {project.done}/{project.total} done
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right 40%: Recent Tasks */}
                    <div className="lg:col-span-2 flex flex-col gap-3">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Recent Tasks
                        </h2>
                        <Card className="border-border/60">
                            <CardContent className="px-0 py-0">
                                {(recentTasks ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground px-5 py-6 text-center">
                                        No tasks yet — open a project to add some.
                                    </p>
                                ) : (
                                    <ul className="divide-y divide-border/50">
                                        {(recentTasks ?? []).map((task, i) => {
                                            const st = statusConfig[task.status as TaskStatus]
                                            const Icon = st.icon
                                            // @ts-expect-error — Supabase join typing
                                            const projectName: string = task.projects?.name ?? '—'

                                            return (
                                                <li
                                                    key={task.id}
                                                    className="flex items-start gap-3 px-5 py-3.5"
                                                >
                                                    <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${st.className.split(' ')[1]}`} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium leading-snug truncate">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                            {projectName}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] shrink-0 px-1.5 py-0 h-5 ${st.className}`}
                                                    >
                                                        {st.label}
                                                    </Badge>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                /* Empty state */
                <Card className="border-dashed border-border/60 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                        <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
                        <div>
                            <p className="font-medium">No projects yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Hit the <strong>+</strong> button in the sidebar to create your first project.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
            {/* ── Project Metric Trackers ── */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-md bg-primary/10 p-1.5">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">Project Metrics</h2>
                            <p className="text-xs text-muted-foreground">
                                {trackers.length > 0
                                    ? `${trackers.length} metric${trackers.length !== 1 ? 's' : ''} across ${new Set(trackers.map((t) => t.project_name)).size} project${new Set(trackers.map((t) => t.project_name)).size !== 1 ? 's' : ''}`
                                    : 'No metrics tracked yet'}
                            </p>
                        </div>
                    </div>
                    <CreateTrackerDialog compact />
                </div>

                {trackers.length > 0 ? (
                    // Group metrics by project_name
                    <div className="space-y-6">
                        {Object.entries(
                            trackers.reduce<Record<string, typeof trackers>>((acc, t) => {
                                acc[t.project_name] = acc[t.project_name] ?? []
                                acc[t.project_name].push(t)
                                return acc
                            }, {})
                        ).map(([projectName, metrics]) => {
                            // Aggregate progress for the project header
                            const avgPct = Math.round(
                                metrics.reduce((sum, m) =>
                                    sum + Math.min(100, (m.current_value / m.target_value) * 100), 0
                                ) / metrics.length
                            )
                            return (
                                <div key={projectName} className="space-y-2">
                                    {/* Project group header */}
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                            {projectName}
                                        </h3>
                                        <div className="flex-1 h-px bg-border/60" />
                                        <span className={`text-xs font-bold tabular-nums ${
                                            avgPct >= 100 ? 'text-emerald-500' :
                                            avgPct >= 60  ? 'text-blue-400' :
                                            avgPct >= 30  ? 'text-amber-400' : 'text-rose-400'
                                        }`}>
                                            {avgPct}% avg
                                        </span>
                                    </div>
                                    {/* Metric cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {metrics.map((tracker) => (
                                            <MetricCard key={tracker.id} tracker={tracker} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <Card className="border-dashed border-border/60 bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                            <div className="rounded-full bg-muted p-4">
                                <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">No project metrics yet</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    Track completion percentages, hours invested, or task counts for your projects.
                                </p>
                            </div>
                            <CreateTrackerDialog />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
