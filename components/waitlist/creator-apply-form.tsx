'use client'

import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useMySocialAuth } from '@/hooks/useMySocialAuth'
import { toast } from 'sonner'

export function CreatorApplyForm() {
  const { session } = useMySocialAuth()
  const [displayName, setDisplayName] = useState('')
  const [socialLink, setSocialLink] = useState('')
  const [niche, setNiche] = useState('')
  const [pitch, setPitch] = useState('')
  const [audienceSize, setAudienceSize] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!session) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/creator-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.sessionAccessToken}`,
        },
        body: JSON.stringify({
          walletAddress: session.user.address,
          email: session.user.email,
          displayName: displayName.trim(),
          socialLink: socialLink.trim(),
          niche: niche.trim(),
          pitch: pitch.trim(),
          audienceSize: audienceSize.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setSubmitted(true)
      toast.success('Application received!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-foreground font-medium">Application received</p>
        <p className="text-sm text-muted-foreground">
          We&apos;ll review your application and follow up if you&apos;re a fit for creator early access.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full text-left">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your creator name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="socialLink">Primary social link</Label>
        <Input
          id="socialLink"
          type="url"
          required
          value={socialLink}
          onChange={(e) => setSocialLink(e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="niche">Content niche</Label>
        <Input
          id="niche"
          required
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="e.g. comedy, music, tech"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pitch">Why DripDrop?</Label>
        <Textarea
          id="pitch"
          required
          rows={4}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="Tell us about your content and why you want early access..."
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="audienceSize">Audience size (optional)</Label>
        <Input
          id="audienceSize"
          value={audienceSize}
          onChange={(e) => setAudienceSize(e.target.value)}
          placeholder="e.g. 10K on TikTok"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-full font-semibold">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit application'
        )}
      </Button>
    </form>
  )
}
