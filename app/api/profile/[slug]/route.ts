import { SOCIAL_INDEX_API } from '@/lib/profile-utils'

function isWalletAddress(slug: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(slug)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const trimmed = decodeURIComponent(slug).trim().replace(/^@/, '')

  if (!trimmed) {
    return Response.json({ error: 'Missing profile slug' }, { status: 400 })
  }

  const upstreamPath = isWalletAddress(trimmed)
    ? `/profiles/address/${trimmed}`
    : `/profiles/username/${encodeURIComponent(trimmed)}`

  try {
    const response = await fetch(`${SOCIAL_INDEX_API}${upstreamPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (response.status === 404) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!response.ok) {
      const details = await response.text()
      return Response.json(
        { error: 'Upstream profile fetch failed', details },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (data && typeof data === 'object' && 'error' in data && data.error) {
      return Response.json({ error: data.error }, { status: 404 })
    }

    return Response.json(data)
  } catch (error) {
    console.error('[Profile Proxy] Request failed:', error)
    return Response.json({ error: 'Profile proxy request failed' }, { status: 502 })
  }
}
