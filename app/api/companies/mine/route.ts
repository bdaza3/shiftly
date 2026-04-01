import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id } = body
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
    if (!svcKey || !svcUrl) return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 })

    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } })

    if (!user_id) return NextResponse.json({ error: 'missing user_id' }, { status: 400 })

    const { data, error } = await svc.from('company_members').select('companies(*)').eq('user_id', user_id)
    console.log('API /companies/mine: query result', { data, error })
    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })
    const companies = (data || []).map((r: any) => r.companies).filter(Boolean)
    console.log('API /companies/mine: processed companies', companies)
    return NextResponse.json({ ok: true, companies })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}