"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/(auth)/login/actions"
import { type User as SupabaseUser } from '@supabase/supabase-js'

interface TopNavProps {
    user: SupabaseUser | null
}

export function TopNav({ user }: TopNavProps) {
    const { theme, setTheme } = useTheme()

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 w-full sticky top-0 z-10">
            <div className="w-full flex-1">
                {/* Mobile menu could go here */}
            </div>

            {user && (
                <span className="text-sm text-muted-foreground mr-2 hidden sm:inline-block">
                    {user.email}
                </span>
            )}

            <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>

            {user ? (
                <form action={logout}>
                    <Button variant="ghost" size="icon" type="submit" title="Logout">
                        <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                        <span className="sr-only">Logout</span>
                    </Button>
                </form>
            ) : (
                <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                </Button>
            )}
        </header>
    )
}
