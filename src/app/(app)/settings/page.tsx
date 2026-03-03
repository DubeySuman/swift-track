import { Settings, User, Bell, Shield, Palette } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SettingSection {
    icon: React.ElementType
    title: string
    description: string
    badge: string
}

const COMING_SOON_SECTIONS: SettingSection[] = [
    {
        icon: Bell,
        title: 'Notifications',
        description: 'Configure how and when you receive task and project updates.',
        badge: 'Coming Soon',
    },
    {
        icon: Palette,
        title: 'Appearance',
        description: 'Customize your theme, accent colour, and font size preferences.',
        badge: 'Coming Soon',
    },
    {
        icon: Shield,
        title: 'Security',
        description: 'Manage your password, active sessions, and two-factor authentication.',
        badge: 'Coming Soon',
    },
]

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const joinedAt = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : '—'

    return (
        <div className="flex flex-col gap-8 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                    <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your account and preferences
                    </p>
                </div>
            </div>

            {/* Account card */}
            <Card className="border-border/60">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border/60 shrink-0">
                            <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Account</CardTitle>
                            <CardDescription className="text-xs">Your profile and login details</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="border-t pt-4">
                    <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-3 text-sm">
                        <dt className="text-muted-foreground font-medium">Email</dt>
                        <dd className="font-mono text-sm">{user?.email ?? '—'}</dd>

                        <dt className="text-muted-foreground font-medium">User ID</dt>
                        <dd className="font-mono text-xs text-muted-foreground truncate">{user?.id ?? '—'}</dd>

                        <dt className="text-muted-foreground font-medium">Member since</dt>
                        <dd>{joinedAt}</dd>
                    </dl>
                </CardContent>
            </Card>

            {/* Coming-soon sections */}
            <div className="flex flex-col gap-3">
                {COMING_SOON_SECTIONS.map((section) => {
                    const Icon = section.icon
                    return (
                        <Card
                            key={section.title}
                            className="border-border/50 opacity-70 bg-muted/20 select-none"
                        >
                            <CardHeader className="py-4 px-5">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-md bg-muted p-2 shrink-0">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm">{section.title}</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                {section.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="text-xs shrink-0 border-muted-foreground/30 text-muted-foreground"
                                    >
                                        {section.badge}
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
