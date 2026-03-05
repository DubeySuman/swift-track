import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'

interface RichTextPreviewProps {
    content: string
    className?: string
}

export function RichTextPreview({ content, className = '' }: RichTextPreviewProps) {
    const editor = useEditor({
        extensions: [StarterKit, Underline],
        content,
        editable: false,
        editorProps: {
            attributes: {
                class: `tiptap text-sm ${className}`,
            },
        },
        immediatelyRender: false,
    })

    if (!editor) return null
    if (!content || content === '') {
        return <p className={`text-sm text-muted-foreground italic ${className}`}>No description provided.</p>
    }

    return <EditorContent editor={editor} className={className} />
}
