'use client'

import { useState, useTransition, useOptimistic } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Camera } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateProfile, updateAvatarUrl, type Profile } from '@/app/actions/profile'

const profileSchema = z.object({
    full_name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
    profile: Profile
}

function getInitials(name: string | null | undefined, fallback = '?') {
    if (!name?.trim()) return fallback
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
}

// ─── Avatar Upload Component ──────────────────────────────────────────────────

function AvatarUpload({
    profile,
    onUpdated,
}: {
    profile: Profile
    onUpdated: (url: string) => void
}) {
    const [uploading, setUploading] = useState(false)
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(profile.avatar_url)

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image must be under 2MB.')
            return
        }

        setUploading(true)
        const supabase = createClient()

        const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        // CRITICAL: Path must be `{userId}/{filename}` so the RLS policy
        // can match `storage.foldername(name)[1]` against `auth.uid()`.
        // A timestamp suffix busts the public CDN cache on re-upload.
        const filePath = `${profile.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            console.error('Avatar upload error:', {
                message: uploadError.message,
                cause: uploadError.cause,
            })
            toast.error('Upload failed: ' + uploadError.message)
            setUploading(false)
            return
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        const result = await updateAvatarUrl(publicUrl)
        if (result.error) {
            toast.error('Failed to save avatar: ' + result.error)
        } else {
            setLocalAvatarUrl(publicUrl)
            onUpdated(publicUrl)
            toast.success('Avatar updated!')
        }

        setUploading(false)
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer">
                <Avatar className="w-24 h-24 border-2 border-border">
                    <AvatarImage src={localAvatarUrl ?? undefined} alt="Profile avatar" />
                    <AvatarFallback className="text-2xl font-semibold bg-muted">
                        {getInitials(profile.full_name)}
                    </AvatarFallback>
                </Avatar>
                <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change avatar"
                >
                    {uploading ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                        <Camera className="w-6 h-6 text-white" />
                    )}
                </label>
                <input
                    id="avatar-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP &mdash; Max 2MB</p>
        </div>
    )
}

// ─── Profile Form Component ───────────────────────────────────────────────────

export function ProfileForm({ profile }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition()

    // useOptimistic: the sidebar / header name updates INSTANTLY on submit,
    // before the server responds. React rolls back if the action fails.
    const [optimisticName, setOptimisticName] = useOptimistic(
        profile.full_name ?? ''
    )

    // Avatar URL is kept as local state so the form can update it without a full page reload.
    const [_, setAvatarUrl] = useState(profile.avatar_url)

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: profile.full_name ?? '',
        },
    })

    const onSubmit = (data: ProfileFormValues) => {
        startTransition(async () => {
            // ← Optimistic update fires here, BEFORE await
            setOptimisticName(data.full_name)

            const formData = new FormData()
            formData.set('full_name', data.full_name)
            const result = await updateProfile(formData)

            if (result.error) {
                toast.error(result.error)
                // React automatically reverts optimisticName on error
            } else {
                toast.success('Profile updated!')
                // Reset isDirty so the Save button disables again
                reset({ full_name: data.full_name })
            }
        })
    }

    return (
        <div className="max-w-2xl space-y-8">
            {/* Optimistic preview banner */}
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                <Avatar className="w-12 h-12 border border-border">
                    <AvatarFallback className="text-base font-semibold bg-muted">
                        {getInitials(optimisticName || profile.full_name)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">
                        {optimisticName || 'Your Name'}
                        {isPending && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                                Saving…
                            </span>
                        )}
                    </p>
                    <p className="text-xs text-muted-foreground">This is how you appear in SwiftTrack</p>
                </div>
            </div>

            {/* Avatar Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Profile Picture</CardTitle>
                    <CardDescription>
                        Click your avatar to upload a new photo. Changes apply immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AvatarUpload
                        profile={profile}
                        onUpdated={(url) => setAvatarUrl(url)}
                    />
                </CardContent>
            </Card>

            {/* Profile Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                    <CardDescription>
                        Update your display name — it appears in the sidebar and top navigation instantly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                placeholder="Your name"
                                {...register('full_name')}
                                className="max-w-sm bg-muted/10 border-border/60"
                            />
                            {errors.full_name && (
                                <p className="text-[13px] text-destructive font-medium">
                                    {errors.full_name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <p className="text-sm text-muted-foreground font-mono">{profile.id}</p>
                            <p className="text-xs text-muted-foreground/60">
                                Email is managed through your auth provider.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending || !isDirty}
                            className="gap-2"
                        >
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
