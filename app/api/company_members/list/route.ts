import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { company_id } = body
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
    if (!svcKey || !svcUrl) return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 })

    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } })
    if (!company_id) return NextResponse.json({ error: 'missing company_id' }, { status: 400 })

    const { data: rows, error } = await svc.from('company_members').select('*').eq('company_id', company_id).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })

    const userIds = (rows || []).map((r: any) => r.user_id).filter(Boolean)
    let profiles: any[] = []
    let users: any[] = []
    if (userIds.length > 0) {
      const { data: p, error: pErr } = await svc.from('profiles').select('id, first_name, last_name, phone, email').in('id', userIds)
      if (!pErr) profiles = p || []
      const { data: u, error: uErr } = await svc.from('users').select('id, full_name, email, role').in('id', userIds)
      if (!uErr) users = u || []
    }

    const members = (rows || []).map((r: any) => {
      const p = profiles.find((x: any) => x.id === r.user_id)
      const u = users.find((x: any) => x.id === r.user_id)
      const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : u?.full_name ?? u?.email
      return { id: r.user_id, role: r.role, startDate: r.created_at, name, email: p?.email ?? u?.email ?? null }
    })

    return NextResponse.json({ ok: true, members })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
