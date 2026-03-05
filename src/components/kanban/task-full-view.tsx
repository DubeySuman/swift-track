'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Save,
    Trash2,
    Circle,
    Clock,
    CheckCircle2,
    MessageSquare,
} from 'lucide-react'
import {
    updateTask,
    deleteTask,
    updateTaskStatus,
    type TaskStatus,
} from '@/app/actions/tasks'
import type { Task } from './task-card'
import { RichTextEditor } from './rich-text-editor'
import { RichTextPreview } from './rich-text-preview'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// ─── Status config ────────────────────────────────────────────────────────────

const statusConfig: Record<
    TaskStatus,
    { label: string; icon: React.ElementType; pill: string }
> = {
    todo: {
        label: 'To Do',
        icon: Circle,
        pill: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25 hover:bg-zinc-500/20',
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        pill: 'bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/20',
    },
    done: {
        label: 'Done',
        icon: CheckCircle2,
        pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20',
    },
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TaskFullViewProps {
    task: Task
    projectId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onTaskUpdate: (task: Task) => void
    onTaskDeleted: (taskId: string) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TaskFullView({
    task,
    projectId,
    open,
    onOpenChange,
    onTaskUpdate,
    onTaskDeleted,
}: TaskFullViewProps) {
    const [title, setTitle] = useState(task.title)
    const [summary, setSummary] = useState(task.summary)
    const [description, setDescription] = useState(task.description ?? '')
    const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status)
    const [error, setError] = useState<string | null>(null)
    const [isEditingDesc, setIsEditingDesc] = useState(false)
    const [isSaving, startSaveTransition] = useTransition()
    const [isDeleting, startDeleteTransition] = useTransition()
    const [isUpdatingStatus, startStatusTransition] = useTransition()

    useEffect(() => {
        setTitle(task.title)
        setSummary(task.summary)
        setDescription(task.description ?? '')
        setCurrentStatus(task.status)
        setIsEditingDesc(false)
        setError(null)
    }, [task.id])

    function handleStatusChange(newStatus: string) {
        const s = newStatus as TaskStatus
        setCurrentStatus(s)
        startStatusTransition(async () => {
            await updateTaskStatus(task.id, s, projectId)
            onTaskUpdate({ ...task, title, description: description || null, status: s })
        })
    }

    function handleSave() {
        if (!title.trim()) { setError('Title is required'); return }
        if (!summary.trim()) { setError('Summary is required'); return }
        setError(null)

        const formData = new FormData()
        formData.set('task_id', task.id)
        formData.set('title', title.trim())
        formData.set('summary', summary.trim())
        formData.set('description', description)
        formData.set('project_id', projectId)

        startSaveTransition(async () => {
            const result = await updateTask(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                onTaskUpdate({
                    ...task,
                    title: title.trim(),
                    summary: summary.trim(),
                    description: description || null,
                    status: currentStatus,
                })
                onOpenChange(false)
            }
        })
    }

    function handleDelete() {
        startDeleteTransition(async () => {
            const result = await deleteTask(task.id, projectId)
            if (result?.error) {
                setError(result.error)
            } else {
                onOpenChange(false)
                onTaskDeleted(task.id)
            }
        })
    }

    const isPending = isSaving || isDeleting || isUpdatingStatus
    const st = statusConfig[currentStatus]

    const createdAt = new Date(task.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/*
                w-[92vw] max-w-5xl — large canvas feel.
                pr-14 on the toolbar clears the Shadcn close button (absolute right-4 top-4 ≈ 40px)
            */}
            <DialogContent className="w-[95vw] max-w-screen-2xl min-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
                {/* Screen-reader accessible title */}
                <DialogTitle className="sr-only">{task.title} — Full View</DialogTitle>

                {/* ── Toolbar ─────────────────────────────────────────────────── */}
                {/*
                    pr-14 (56px) gives room for the Shadcn DialogClose button
                    which is positioned absolute right-4 top-4 (~40px from right)
                */}
                <div className="flex items-center gap-3 px-10 pr-16 pt-4 pb-3 border-b shrink-0">
                    {/* Status pill — SelectValue renders the item content (icon + label),
                        so we do NOT add a separate icon here to avoid the double-icon bug */}
                    <Select
                        value={currentStatus}
                        onValueChange={handleStatusChange}
                        disabled={isPending}
                    >
                        <SelectTrigger
                            className={`h-7 w-auto gap-1.5 rounded-full border text-xs px-3 font-medium focus:ring-0 focus:ring-offset-0 ${st.pill}`}
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {(Object.entries(statusConfig) as [TaskStatus, typeof st][]).map(
                                ([key, cfg]) => {
                                    const Icon = cfg.icon
                                    return (
                                        <SelectItem key={key} value={key} className="text-xs">
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-3 w-3 shrink-0" />
                                                {cfg.label}
                                            </div>
                                        </SelectItem>
                                    )
                                }
                            )}
                        </SelectContent>
                    </Select>

                    <span className="text-xs text-muted-foreground/60 select-none">
                        Created {createdAt}
                    </span>
                </div>

                {/* ── Scrollable Body ──────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="flex-1 overflow-y-auto flex flex-col p-10 gap-8"
                >
                    <div>
                        {error && (
                            <div className="mb-4 rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Large borderless title input */}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title…"
                            className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none border-none placeholder:text-muted-foreground/30 caret-primary"
                        />

                        {/* Summary input */}
                        <div className="grid gap-2 mt-8">
                            <Label htmlFor="modal-summary" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                                Summary
                            </Label>
                            <Input
                                id="modal-summary"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="Brief overview of the task"
                                className="bg-muted/10 border-border/60"
                            />
                        </div>
                    </div>

                    {/* Rich text description canvas */}
                    <div className="flex-1 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                                Description
                            </p>
                            {!isEditingDesc && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[11px] text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider font-semibold"
                                    onClick={() => setIsEditingDesc(true)}
                                >
                                    Edit
                                </Button>
                            )}
                        </div>

                        {isEditingDesc ? (
                            <div className="flex flex-col gap-2">
                                <RichTextEditor
                                    content={description}
                                    onChange={setDescription}
                                    placeholder="What is this task about? What does 'done' look like?"
                                    minHeight={220}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setDescription(task.description ?? '')
                                            setIsEditingDesc(false)
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                            // The formal save button will update DB, but we drop out of edit mode
                                            setIsEditingDesc(false)
                                        }}
                                    >
                                        Done
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingDesc(true)}
                                title="Click to edit description"
                                className="cursor-text rounded-md hover:bg-muted/30 p-2 -mx-2 transition-colors min-h-[140px]"
                            >
                                <RichTextPreview content={description} />
                            </div>
                        )}
                    </div>

                    {/* ── Comments Placeholder ─────────────────────────────────── */}
                    <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 px-5 py-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MessageSquare className="h-4 w-4" />
                                <span className="font-medium">Comments</span>
                            </div>
                            <Badge
                                variant="outline"
                                className="text-[10px] border-muted-foreground/25 text-muted-foreground/60"
                            >
                                Coming Soon
                            </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground/50 leading-relaxed">
                            Discuss this task, share updates, or leave notes for collaborators.
                            This section will appear here automatically once the Comments feature ships.
                        </p>
                    </div>
                </motion.div>

                {/* ── Footer ──────────────────────────────────────────────────── */}
                <div className="border-t px-10 py-5 flex items-center justify-between shrink-0 bg-muted/5">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isPending}
                                className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Task
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    <span className="font-medium text-foreground">"{task.title}"</span>{' '}
                                    will be permanently deleted. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isDeleting ? 'Deleting…' : 'Delete Task'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending} className="gap-2">
                            <Save className="h-4 w-4" />
                            {isSaving ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
