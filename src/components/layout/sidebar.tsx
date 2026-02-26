import Link from "next/link"
import { LayoutDashboard, CheckSquare, Settings } from "lucide-react"

export function Sidebar() {
    return (
        <aside className="hidden border-r bg-muted/40 md:block w-64 h-screen fixed top-0 left-0 bg-background flex-col z-10 transition-transform">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <CheckSquare className="h-6 w-6" />
                    <span className="text-xl">SwiftTrack</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-4">
                <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                    <Link
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Projects
                    </Link>
                    <Link
                        href="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </nav>
            </div>
        </aside>
    )
}
