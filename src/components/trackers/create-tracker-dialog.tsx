'use client'

import { useState, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createTracker, type MetricType } from '@/app/actions/trackers'

// ─── Schema ───────────────────────────────────────────────────────────────────

const METRIC_TYPES: { value: MetricType; label: string; description: string }[] = [
    {
        value: 'Percentage',
        label: 'Percentage (%)',
        description: 'Track completion as a percentage (e.g. 75% of module done)',
    },
    {
        value: 'Hours',
        label: 'Hours (hrs)',
        description: 'Track time invested (e.g. 40hrs of design work)',
    },
    {
        value: 'Tasks',
        label: 'Tasks (count)',
        description: 'Track discrete deliverables (e.g. 12 API endpoints)',
    },
]

const schema = z.object({
    project_name: z.string().min(1, 'Project name is required').max(80),
    metric_name: z.string().min(1, 'Metric name is required').max(80),
    metric_type: z.enum(['Percentage', 'Hours', 'Tasks'] as [MetricType, ...MetricType[]]),
    target_value: z
        .string()
        .min(1, 'Target is required')
        .refine(
            (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
            { message: 'Must be a positive number' }
        ),
})

type FormValues = z.infer<typeof schema>

// ─── Quick-fill templates ─────────────────────────────────────────────────────

const TEMPLATES = [
    { project_name: 'SwiftTrack', metric_name: 'Frontend UI', metric_type: 'Percentage', target_value: '100' },
    { project_name: 'SwiftTrack', metric_name: 'API Integration', metric_type: 'Tasks', target_value: '15' },
    { project_name: 'SwiftTrack', metric_name: 'Design Hours', metric_type: 'Hours', target_value: '40' },
    { project_name: 'Client App', metric_name: 'Sprint Tasks', metric_type: 'Tasks', target_value: '20' },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateTrackerDialogProps {
    compact?: boolean
}

export function CreateTrackerDialog({ compact = false }: CreateTrackerDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [selectedType, setSelectedType] = useState<MetricType>('Percentage')

    const {
        register,
        handleSubmit,
        control,
        setValue,
        reset,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            project_name: '',
            metric_name: '',
            metric_type: 'Percentage',
            target_value: '',
        },
    })

    const watchedType = watch('metric_type')
    const targetPlaceholder =
        watchedType === 'Percentage' ? '100' :
        watchedType === 'Hours' ? '40' : '20'

    const targetLabel =
        watchedType === 'Percentage' ? 'Target (%)' :
        watchedType === 'Hours' ? 'Target (hrs)' : 'Target (tasks)'

    const fillTemplate = (t: typeof TEMPLATES[0]) => {
        setValue('project_name', t.project_name)
        setValue('metric_name', t.metric_name)
        setValue('metric_type', t.metric_type as MetricType)
        setValue('target_value', t.target_value)
        setSelectedType(t.metric_type as MetricType)
    }

    const onSubmit = (data: FormValues) => {
        startTransition(async () => {
            const formData = new FormData()
            formData.set('project_name', data.project_name)
            formData.set('metric_name', data.metric_name)
            formData.set('metric_type', data.metric_type)
            formData.set('target_value', data.target_value)

            const result = await createTracker(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(`Tracker "${data.metric_name}" added to ${data.project_name}!`)
                reset()
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {compact ? (
                    <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Add metric tracker">
                        <Plus className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Metric
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Project Metric</DialogTitle>
                    <DialogDescription>
                        Track a specific deliverable, time investment, or completion percentage for any project.
                    </DialogDescription>
                </DialogHeader>

                {/* Template chips */}
                <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Quick templates:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {TEMPLATES.map((t) => (
                            <button
                                key={`${t.project_name}-${t.metric_name}`}
                                type="button"
                                onClick={() => fillTemplate(t)}
                                className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground leading-none"
                            >
                                {t.metric_name}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
                    {/* Project Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="m-project">
                            Project Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="m-project"
                            placeholder="e.g. SwiftTrack, Client Dashboard"
                            {...register('project_name')}
                        />
                        {errors.project_name && (
                            <p className="text-[12px] text-destructive">{errors.project_name.message}</p>
                        )}
                    </div>

                    {/* Metric / Task Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="m-metric">
                            Metric / Task Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="m-metric"
                            placeholder="e.g. Frontend UI, API Integration, Design Hours"
                            {...register('metric_name')}
                        />
                        {errors.metric_name && (
                            <p className="text-[12px] text-destructive">{errors.metric_name.message}</p>
                        )}
                    </div>

                    {/* Type + Target (side by side) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>
                                Metric Type <span className="text-destructive">*</span>
                            </Label>
                            <Controller
                                control={control}
                                name="metric_type"
                                render={({ field }) => (
                                    <Select
                                        onValueChange={(v) => {
                                            field.onChange(v)
                                            setSelectedType(v as MetricType)
                                        }}
                                        value={field.value}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {METRIC_TYPES.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.metric_type && (
                                <p className="text-[12px] text-destructive">{errors.metric_type.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="m-target">
                                {targetLabel} <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="m-target"
                                type="number"
                                min="0"
                                step="any"
                                placeholder={targetPlaceholder}
                                {...register('target_value')}
                            />
                            {errors.target_value && (
                                <p className="text-[12px] text-destructive">{errors.target_value.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Live type description */}
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border border-border/50">
                        {METRIC_TYPES.find((t) => t.value === watchedType)?.description}
                    </p>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset()
                                setOpen(false)
                            }}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} className="gap-2">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Add Metric
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
