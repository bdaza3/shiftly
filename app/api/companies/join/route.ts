import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { join_code, user_id } = body
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

    // ensure membership exists
    const { data: existing, error: exErr } = await svc.from('company_members').select('*').eq('company_id', company.id).eq('user_id', user_id).limit(1)
    if (exErr) return NextResponse.json({ error: exErr.message || String(exErr) }, { status: 400 })
    if (!existing || existing.length === 0) {
      const { error: insErr } = await svc.from('company_members').insert({ company_id: company.id, user_id, role: 'employee' })
      if (insErr) return NextResponse.json({ error: insErr.message || String(insErr) }, { status: 400 })
    }

    return NextResponse.json({ ok: true, company })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
