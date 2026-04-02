'use client'

import { LogOut, Settings, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SidebarUserMenuProps {
    displayName: string
    email: string | undefined
    avatarUrl: string | null | undefined
}

function getInitials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('') || '?'
}

export function SidebarUserMenu({ displayName, email, avatarUrl }: SidebarUserMenuProps) {
    const router = useRouter()

    const handleSignOut = async () => {
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        if (error) {
            toast.error('Sign out failed: ' + error.message)
            return
        }
        router.push('/login')
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="User menu"
                >
                    <Avatar className="w-8 h-8 border border-border shrink-0">
                        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                            {getInitials(displayName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {email}
                        </p>
                    </div>
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56"
            >
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm truncate">{displayName}</span>
                        <span className="text-xs text-muted-foreground truncate">{email}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => router.push('/profile')}
                    className="gap-2 cursor-pointer"
                >
                    <Settings className="h-4 w-4" />
                    Profile &amp; Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
