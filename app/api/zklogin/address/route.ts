import { computeZkLoginAddress, decodeJwt } from '@socialproof/myso/zklogin'
import { NextRequest, NextResponse } from 'next/server'
import { getSaltServiceUrl } from '@/lib/mysocial-auth-config'

const SALT_API = (process.env.MYSOCIAL_SALT_API_URL || getSaltServiceUrl()).replace(/\/$/, '')

/** Session tokens carry no `aud`, so the SDK's decodeJwt cannot read them. */
function sessionSubject(token: string): string | undefined {
  try {
    const part = token.split('.')[1] ?? ''
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const { sub } = JSON.parse(json) as { sub?: unknown }
    return typeof sub === 'string' ? sub : undefined
  } catch {
    return undefined
  }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ error: 'Bearer token required' }, { status: 401 })
  }
  const accessToken = authorization.slice(authorization.indexOf(' ') + 1).trim()
  const saltResponse = await fetch(`${SALT_API}/zklogin-salt`, {
    headers: { authorization },
    cache: 'no-store',
  })
  if (!saltResponse.ok) {
    return new NextResponse(await saltResponse.text(), { status: saltResponse.status })
  }
  const saltRow = (await saltResponse.json()) as { salt?: string; iss?: string; aud?: string }
  if (!saltRow.salt || !saltRow.iss || !saltRow.aud) {
    return NextResponse.json({ error: 'zkLogin salt is incomplete' }, { status: 409 })
  }
  const sessionSub = sessionSubject(accessToken)
  const prefix = `${saltRow.iss}:`
  if (!sessionSub?.startsWith(prefix)) {
    return NextResponse.json({ error: 'Session does not match this zkLogin account' }, { status: 403 })
  }
  const claimValue = sessionSub.slice(prefix.length)
  if (!claimValue) {
    return NextResponse.json({ error: 'Session subject is missing' }, { status: 403 })
  }
  const body = (await request.json().catch(() => ({}))) as { id_token?: string }
  if (body.id_token) {
    let claims: ReturnType<typeof decodeJwt>
    try {
      claims = decodeJwt(body.id_token)
    } catch {
      return NextResponse.json({ error: 'OAuth token could not be read' }, { status: 400 })
    }
    if (claims.iss !== saltRow.iss || claims.sub !== claimValue || claims.aud !== saltRow.aud) {
      return NextResponse.json({ error: 'OAuth token does not match this zkLogin account' }, { status: 403 })
    }
  }
  const address = computeZkLoginAddress({
    claimName: 'sub',
    claimValue,
    iss: saltRow.iss,
    aud: saltRow.aud,
    userSalt: saltRow.salt,
    legacyAddress: false,
  })
  const saved = await fetch(`${SALT_API}/zklogin-address`, {
    method: 'POST',
    headers: { authorization, 'content-type': 'application/json' },
    body: JSON.stringify({ address }),
    cache: 'no-store',
  })
  if (!saved.ok) {
    return new NextResponse(await saved.text(), { status: saved.status })
  }
  return NextResponse.json({ address })
}
