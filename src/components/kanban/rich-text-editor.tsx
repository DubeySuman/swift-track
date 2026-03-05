'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
} from 'lucide-react'

// ─── Toolbar Button ───────────────────────────────────────────────────────────

interface ToolbarButtonProps {
    onClick: () => void
    active?: boolean
    title: string
    children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            title={title}
            // onMouseDown prevents the editor from losing focus when clicking toolbar
            onMouseDown={(e) => {
                e.preventDefault()
                onClick()
            }}
            className={`rounded p-1.5 transition-colors ${active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
        >
            {children}
        </button>
    )
}

// ─── Editor ──────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
    /** Initial HTML content */
    content: string
    onChange: (html: string) => void
    placeholder?: string
    /** Minimum height of the editable area in pixels (default 180) */
    minHeight?: number
}

export function RichTextEditor({
    content,
    onChange,
    placeholder = 'Start writing…',
    minHeight = 180,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({ placeholder }),
        ],
        content,
        onUpdate: ({ editor }) => {
            // getHTML() returns '<p></p>' for empty content — normalise to ''
            const html = editor.getHTML()
            onChange(html === '<p></p>' ? '' : html)
        },
        editorProps: {
            attributes: {
                // 'tiptap' class is targeted by globals.css prose styles
                class: 'tiptap text-sm',
                style: `min-height:${minHeight}px`,
            },
        },
        // Must be false to avoid a React hydration mismatch with Next.js SSR
        immediatelyRender: false,
    })

    if (!editor) return null

    return (
        <div className="flex flex-col">
            {/* ── Toolbar ── */}
            <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg border border-border/50 bg-muted/30 mb-2">
                <ToolbarButton
                    title="Bold (⌘B)"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarButton
                    title="Italic (⌘I)"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarButton
                    title="Underline (⌘U)"
                    active={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolbarButton>

                <div className="mx-1 h-4 w-px bg-border/60" aria-hidden />

                <ToolbarButton
                    title="Bullet list"
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarButton
                    title="Numbered list"
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
            </div>

            {/* ── Editor Canvas ── */}
            <EditorContent editor={editor} className="px-5 py-4" />
        </div>
    )
}
