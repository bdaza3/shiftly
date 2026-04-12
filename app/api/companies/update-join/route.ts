import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { company_id, join_code } = body
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
    if (!svcKey || !svcUrl) return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 })

    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } })

    if (!company_id) return NextResponse.json({ error: 'missing company_id' }, { status: 400 })

    const updatePayload: any = {}
    // set join_code to null to disable, or to provided value to enable
    if (join_code === null || join_code === undefined) updatePayload.join_code = null
    else updatePayload.join_code = String(join_code).toUpperCase()

    const { data, error } = await svc.from('companies').update(updatePayload).eq('id', company_id).select().single()
    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })

    return NextResponse.json({ ok: true, company: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
