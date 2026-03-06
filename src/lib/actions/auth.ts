'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signInWithMagicLink(email: string) {
    const supabase = await createClient()

    // Assuming we want to redirect to dashboard (/)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${baseUrl}/api/auth/callback`,
        },
    })

    if (error) {
        console.error('Magic link sign-in error:', error)
        await supabase.auth.signOut()
        return { error: error.message }
    }

    return { success: true }
}

export async function signInWithPassword(email: string, password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Password sign-in error:', error)
        await supabase.auth.signOut()
        return { error: error.message }
    }

    return { success: true }
}

export async function signUpWithEmail(email: string, password: string, name: string) {
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name
            },
            emailRedirectTo: `${baseUrl}/api/auth/callback`,
        }
    })

    if (error) {
        console.error('Email sign-up error:', error)
        await supabase.auth.signOut()
        return { error: error.message }
    }

    return { success: true }
}

export async function signInWithGoogle() {
    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${baseUrl}/api/auth/callback`, // Recommended for OAuth PKCE flow
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url) // redirect to google
    }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
