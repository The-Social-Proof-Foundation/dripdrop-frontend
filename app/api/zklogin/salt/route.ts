import { NextRequest, NextResponse } from 'next/server'
import { getSaltServiceUrl } from '@/lib/mysocial-auth-config'

const SALT_API = (process.env.MYSOCIAL_SALT_API_URL || getSaltServiceUrl()).replace(/\/$/, '')

async function forward(request: NextRequest): Promise<NextResponse> {
  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return NextResponse.json({ error: 'Bearer token required' }, { status: 401 })
  }
  const response = await fetch(`${SALT_API}/zklogin-salt`, {
    method: request.method,
    headers: {
      authorization,
      'content-type': 'application/json',
    },
    body: request.method === 'GET' ? undefined : await request.text(),
    cache: 'no-store',
  })
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
  })
}

export function GET(request: NextRequest) {
  return forward(request)
}

export function PUT(request: NextRequest) {
  return forward(request)
}
