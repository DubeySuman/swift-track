// Auth route group layout — no sidebar, no top nav.
// These pages are full-screen centered layouts for /login and /signup.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
