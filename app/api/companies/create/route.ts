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

    // insert company
    const { data: created, error: createErr } = await svc.from('companies').insert({ name: name?.trim(), join_code: join_code ?? null }).select('*').maybeSingle()
    if (createErr) {
      // detect RLS-style error
      if (createErr.message && createErr.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ error: 'Row-level security prevented writing to companies. Ensure service role key is used.' }, { status: 500 })
      }
      return NextResponse.json({ error: createErr.message || String(createErr) }, { status: 400 })
    }

    // add membership if user_id provided
    if (user_id && created?.id) {
      const { error: cmErr } = await svc.from('company_members').insert({ company_id: created.id, user_id, role: 'manager' })
      if (cmErr) {
        return NextResponse.json({ error: cmErr.message || String(cmErr) }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true, company: created })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
