import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, user_id, join_code } = body
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
    if (!svcKey || !svcUrl) return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 })

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    if (anonKey && svcKey === anonKey) {
      return NextResponse.json({ error: 'service role key appears to be the public anon key. Set the server-only service role key in your environment.' }, { status: 500 })
    }

    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } })

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

return NextResponse.json({ ok: true, company })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
