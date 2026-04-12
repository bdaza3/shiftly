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
    console.warn('companies/create ensureProfile: auth lookup failed', error)
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
    const { user_id, first_name, last_name, phone } = body
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
    if (!svcKey || !svcUrl) return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 })

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    if (anonKey && svcKey === anonKey) {
      return NextResponse.json({ error: 'service role key appears to be the public anon key. Set the server-only service role key in your environment.' }, { status: 500 })
    }

    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } })

    if (!user_id) return NextResponse.json({ error: 'missing user_id' }, { status: 400 })
    await ensureProfile(svc, user_id, { first_name, last_name, phone })

// create company
const { data: company, error: createErr } = await svc
  .from('companies')
  .insert({
    name: body.name,
    join_code: (body.join_code || '').toUpperCase()
  })
  .select()
  .single()

if (createErr) {
  return NextResponse.json({ error: createErr.message }, { status: 400 })
}

// add membership as admin if creating a company, otherwise just return the company info (user can join from dashboard)
const { error: memberErr } = await svc
  .from('company_members')
  .insert({
    company_id: company.id,
    user_id,
    role: 'admin'
  })

if (memberErr) {
  return NextResponse.json({ error: memberErr.message }, { status: 400 })
}

return NextResponse.json({ ok: true, company: { ...company, current_user_role: 'admin' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
