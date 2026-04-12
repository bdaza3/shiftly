import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const joinCode = (body?.join_code || '').toString().trim().toUpperCase()

    if (!joinCode) {
      return NextResponse.json({ error: 'missing join_code' }, { status: 400 })
    }

    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
    if (!svcKey || !svcUrl) return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 })

    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } })
    const { data, error } = await svc
      .from('companies')
      .select('id, name, industry, join_code')
      .eq('join_code', joinCode)
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })
    if (!data) return NextResponse.json({ error: 'company not found' }, { status: 404 })

    return NextResponse.json({ ok: true, company: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
