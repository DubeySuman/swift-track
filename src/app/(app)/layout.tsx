import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

// App route group layout — only reachable by authenticated users.
// Renders the full sidebar + top nav shell.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Belt-and-suspenders guard: middleware already redirects,
    // but this ensures SSR never leaks the app shell.
    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-background">
            <Sidebar />
            <div className="flex flex-col md:pl-64 w-full min-h-screen">
                <TopNav user={user} />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
