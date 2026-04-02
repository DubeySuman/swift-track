'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Profile = {
    id: string
    full_name: string | null
    avatar_url: string | null
    updated_at: string | null
}

export async function getProfile(): Promise<Profile | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, updated_at')
        .eq('id', user.id)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
        return null
    }

    return data
}

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const full_name = formData.get('full_name') as string

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: full_name.trim(), updated_at: new Date().toISOString() })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating profile:', error)
        return { error: error.message }
    }

    revalidatePath('/profile')
    revalidatePath('/dashboard')
    return { success: true }
}

export async function updateAvatarUrl(avatarUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

    if (error) {
        console.error('Error updating avatar:', error)
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}
