'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createTask } from '@/app/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

interface AddTaskDialogProps {
    projectId: string
}

export function AddTaskDialog({ projectId }: AddTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await createTask(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setOpen(false)
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(null) }}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Add a new task</DialogTitle>
                    <DialogDescription>
                        This task will be added to the "To Do" column.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="project_id" value={projectId} />
                    <div className="grid gap-4 py-4">
                        {error && (
                            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="task-title">Title</Label>
                            <Input
                                id="task-title"
                                name="title"
                                placeholder="e.g. Design the landing page"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="task-description">Description (Optional)</Label>
                            <Textarea
                                id="task-description"
                                name="description"
                                placeholder="Add more context..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
