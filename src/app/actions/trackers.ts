'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MetricType = 'Percentage' | 'Hours' | 'Tasks'

export interface Tracker {
    id: string
    user_id: string
    project_name: string
    metric_name: string
    metric_type: MetricType
    target_value: number
    current_value: number
    created_at: string
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getTrackers(): Promise<Tracker[]> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('trackers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching trackers:', error)
        return []
    }

    return data ?? []
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createTracker(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const project_name = (formData.get('project_name') as string)?.trim()
    const metric_name = (formData.get('metric_name') as string)?.trim()
    const metric_type = formData.get('metric_type') as MetricType
    const target_value = parseFloat(formData.get('target_value') as string)

    if (!project_name || !metric_name || !metric_type || isNaN(target_value) || target_value <= 0) {
        return { error: 'All required fields must be filled.' }
    }

    const { error } = await supabase.from('trackers').insert({
        user_id: user.id,
        project_name,
        metric_name,
        metric_type,
        target_value,
        current_value: 0,
    })

    if (error) {
        console.error('Error creating tracker:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

// ─── Update progress ──────────────────────────────────────────────────────────

export async function updateProgress(trackerId: string, newValue: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    if (isNaN(newValue) || newValue < 0) {
        return { error: 'Value must be a non-negative number.' }
    }

    const { error } = await supabase
        .from('trackers')
        .update({ current_value: newValue })
        .eq('id', trackerId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating progress:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteTracker(trackerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('trackers')
        .delete()
        .eq('id', trackerId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting tracker:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
