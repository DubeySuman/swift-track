import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ProfileForm } from '@/components/profile-form'
import { type Profile } from '@/app/actions/profile'

export const metadata = {
    title: 'Profile — SwiftTrack',
    description: 'Manage your SwiftTrack profile and account settings.',
}

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Try to fetch the profile; if it doesn't exist yet, upsert it now.
    let { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, updated_at')
        .eq('id', user.id)
        .single()

    if (!profile) {
        const { data: upserted } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: user.user_metadata?.full_name ?? null,
                avatar_url: user.user_metadata?.avatar_url ?? null,
                updated_at: new Date().toISOString(),
            })
            .select('id, full_name, avatar_url, updated_at')
            .single()
        profile = upserted
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <p className="text-muted-foreground text-sm">
                    Unable to load profile. Please try refreshing.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Manage your personal information and avatar.
                </p>
            </div>
            <ProfileForm profile={profile as Profile} />
        </div>
    )
}
