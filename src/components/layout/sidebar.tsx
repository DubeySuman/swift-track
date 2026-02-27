import Link from "next/link"
import { LayoutDashboard, CheckSquare, Settings, Folder } from "lucide-react"
import { createClient } from "@/utils/supabase/server"
import { CreateProjectDialog } from "@/components/layout/create-project-dialog"

export async function Sidebar() {
    const supabase = await createClient()

    // Fetch projects for the logged in user
    // This fails gracefully and returns an empty list if not logged in
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false })
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
                    <div className="flex items-center justify-between px-3 py-2">
                        <h2 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            Projects
                        </h2>
                        <CreateProjectDialog />
                    </div>

                    <div className="space-y-1 mb-4">
                        {projects && projects.length > 0 ? (
                            projects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/projects/${project.id}`}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                                >
                                    <Folder className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{project.name}</span>
                                </Link>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground italic">
                                No projects yet.
                            </div>
                        )}
                    </div>

                    <div className="px-3 py-2 mt-4">
                        <h2 className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                            General
                        </h2>
                    </div>
                    <Link
                        href="/projects"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </nav>
            </div>
        </aside>
    )
}
