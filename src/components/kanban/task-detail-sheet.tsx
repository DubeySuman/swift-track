'use client'

import { useState, useTransition, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Save, Trash2 } from 'lucide-react'
import { updateTask, deleteTask } from '@/app/actions/tasks'
import type { Task } from './task-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
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

interface TaskDetailSheetProps {
    task: Task
    projectId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onTaskUpdate: (task: Task) => void
    onTaskDeleted: (taskId: string) => void
}

export function TaskDetailSheet({
    task,
    projectId,
    open,
    onOpenChange,
    onTaskUpdate,
    onTaskDeleted,
}: TaskDetailSheetProps) {
    const [title, setTitle] = useState(task.title)
    const [description, setDescription] = useState(task.description ?? '')
    const [error, setError] = useState<string | null>(null)
    const [isSaving, startSaveTransition] = useTransition()
    const [isDeleting, startDeleteTransition] = useTransition()

    // Sync form fields whenever a different task is opened
    useEffect(() => {
        setTitle(task.title)
        setDescription(task.description ?? '')
        setError(null)
    }, [task.id])

    function handleSave() {
        if (!title.trim()) {
            setError('Title is required')
            return
        }
        setError(null)

        const formData = new FormData()
        formData.set('task_id', task.id)
        formData.set('title', title.trim())
        formData.set('description', description.trim())
        formData.set('project_id', projectId)

        startSaveTransition(async () => {
            const result = await updateTask(formData)
            if (result?.error) {
                setError(result.error)
            } else {
                onTaskUpdate({ ...task, title: title.trim(), description: description.trim() || null })
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

    const createdAt = new Date(task.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    const isPending = isSaving || isDeleting

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="flex flex-col h-full"
                >
                    <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                        <SheetTitle className="text-left text-base">Edit Task</SheetTitle>
                        <SheetDescription className="text-left flex items-center gap-1.5 text-xs mt-1">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            Created {createdAt}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col gap-5 px-6 py-6 flex-1 overflow-y-auto">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive"
                            >
                                {error}
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.08 }}
                            className="grid gap-2"
                        >
                            <Label htmlFor="sheet-title">Title</Label>
                            <Input
                                id="sheet-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                autoFocus
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.13 }}
                            className="grid gap-2"
                        >
                            <Label htmlFor="sheet-description">Description</Label>
                            <Textarea
                                id="sheet-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add more context about this task..."
                                rows={6}
                                className="resize-none"
                            />
                        </motion.div>
                    </div>

                    {/* Footer — Save/Cancel on right, Delete on left */}
                    <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
                        {/* Delete with confirmation guardrail */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isPending}
                                    className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <span className="font-medium text-foreground">"{task.title}"</span> will be permanently deleted. This action cannot be undone.
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

                        {/* Save / Cancel */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isPending} className="gap-2">
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </SheetContent>
        </Sheet>
    )
}
