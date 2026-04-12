import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type ProfileInput = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
}

type AuthMetadata = {
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  phone?: string
}

async function ensureProfile(
  svc: ReturnType<typeof createClient>,
  userId: string,
  profileInput: ProfileInput
) {
  let metadata: AuthMetadata = {}

  try {
    const { data, error } = await svc.auth.admin.getUserById(userId)
    if (!error) metadata = data?.user?.user_metadata ?? {}
  } catch (error) {
    console.warn('companies/join ensureProfile: auth lookup failed', error)
  }

  const payload: { id: string; first_name?: string; last_name?: string; phone?: string } = { id: userId }
  const firstName = profileInput.first_name ?? metadata.firstName ?? metadata.first_name
  const lastName = profileInput.last_name ?? metadata.lastName ?? metadata.last_name
  const phone = profileInput.phone ?? metadata.phone

  if (firstName !== undefined && firstName !== null && firstName !== '') payload.first_name = firstName
  if (lastName !== undefined && lastName !== null && lastName !== '') payload.last_name = lastName
  if (phone !== undefined && phone !== null && phone !== '') payload.phone = phone

  const { error } = await svc.from('profiles').upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { join_code, user_id, first_name, last_name, phone } = body
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
    if (!svcKey || !svcUrl) return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 })

    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } })

    // find company by join code
    const { data: companies, error: findErr } = await svc.from('companies').select('*').eq('join_code', (join_code || '').toUpperCase()).limit(1)
    if (findErr) return NextResponse.json({ error: findErr.message || String(findErr) }, { status: 400 })
    const company = companies && companies[0]
    if (!company) return NextResponse.json({ error: 'company not found' }, { status: 404 })

    if (!user_id) return NextResponse.json({ error: 'missing user_id' }, { status: 400 })

    await ensureProfile(svc, user_id, { first_name, last_name, phone })

    // ensure membership exists
    const { data: existing, error: exErr } = await svc.from('company_members').select('*').eq('company_id', company.id).eq('user_id', user_id).limit(1)
    if (exErr) return NextResponse.json({ error: exErr.message || String(exErr) }, { status: 400 })
    let role = existing?.[0]?.role ?? null
    if (!existing || existing.length === 0) {
      const { error: insErr } = await svc.from('company_members').insert({ company_id: company.id, user_id, role: 'employee' })
      if (insErr) return NextResponse.json({ error: insErr.message || String(insErr) }, { status: 400 })
      role = 'employee'
    }

    return NextResponse.json({ ok: true, company: { ...company, current_user_role: role ?? 'employee' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
