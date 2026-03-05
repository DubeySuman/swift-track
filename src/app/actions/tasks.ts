'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export async function createTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const title = formData.get('title') as string
    const summary = formData.get('summary') as string
    const description = formData.get('description') as string
    const projectId = formData.get('project_id') as string

    if (!title?.trim()) return { error: 'Task title is required' }
    if (!summary?.trim()) return { error: 'Task summary is required' }

    const { data: newTask, error } = await supabase
        .from('tasks')
        .insert({
            title: title.trim(),
            summary: summary.trim(),
            description: description?.trim() || null,
            project_id: projectId,
            user_id: user.id,
            status: 'todo',
        })
        .select('id, title, summary, description, status, created_at')
        .single()

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { success: true, task: newTask }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId)
        .eq('user_id', user.id) // extra safety — only update own tasks

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function updateTask(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const taskId = formData.get('task_id') as string
    const title = formData.get('title') as string
    const summary = formData.get('summary') as string
    const description = formData.get('description') as string
    const projectId = formData.get('project_id') as string

    if (!title?.trim()) return { error: 'Task title is required' }
    if (!summary?.trim()) return { error: 'Task summary is required' }

    const { error } = await supabase
        .from('tasks')
        .update({
            title: title.trim(),
            summary: summary.trim(),
            description: description?.trim() || null,
        })
        .eq('id', taskId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function deleteTask(taskId: string, projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id) // RLS + extra guard

    if (error) return { error: error.message }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}
