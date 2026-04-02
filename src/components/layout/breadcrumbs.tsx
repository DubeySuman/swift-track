'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

// Human-readable labels for known path segments
const SEGMENT_LABELS: Record<string, string> = {
    dashboard: 'Dashboard',
    profile: 'Profile',
    settings: 'Settings',
    projects: 'Projects',
}

function formatSegment(segment: string): string {
    // Check static map first
    if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment]
    // Otherwise title-case it (handles project names passed as slugs)
    return segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function Breadcrumbs() {
    const pathname = usePathname()

    // Split path and remove empty segments
    const segments = pathname.split('/').filter(Boolean)

    // Build cumulative href for each crumb
    const crumbs = segments.map((segment, index) => ({
        label: formatSegment(segment),
        href: '/' + segments.slice(0, index + 1).join('/'),
    }))

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
            <Link
                href="/dashboard"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Home"
            >
                <Home className="h-4 w-4" />
            </Link>

            {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1
                return (
                    <span key={crumb.href} className="flex items-center gap-1">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        {isLast ? (
                            <span className="font-medium text-foreground" aria-current="page">
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                href={crumb.href}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </span>
                )
            })}
        </nav>
    )
}
