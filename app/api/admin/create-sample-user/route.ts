import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, role, company_id } = body;
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    if (!svcKey || !svcUrl) {
      return NextResponse.json({ error: 'missing service role key or url' }, { status: 500 });
    }

    // Guard: ensure the service key isn't accidentally the public anon key
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
    if (anonKey && svcKey === anonKey) {
      return NextResponse.json({ error: 'service role key appears to be the public anon key. Set the server-only service role key in your environment and restart the dev server.' }, { status: 500 });
    }
    const svc = createClient(svcUrl, svcKey, { auth: { persistSession: false } });

    // diagnostic: can we read from profiles with this client?
    let canSelectProfiles = false;
    try {
      const sel = await svc.from('profiles').select('id').limit(1);
      if (!sel.error) canSelectProfiles = true;
    } catch (e) {
      // ignore - we'll report below
    }

    // Ensure we have a profile id that matches an auth user.
    // If caller didn't provide `id`, require `email` and create an auth user first so the profile can reference it.
    let profileId = id;
    if (!profileId) {
      if (!body.email) {
        return NextResponse.json({ error: 'Missing `id` or `email`. Provide an existing user id or an email to create a new auth user.' }, { status: 400 });
      }
      try {
        const password = 'TempPass!' + Math.floor(Math.random() * 90000 + 10000);
        const createRes: any = await (svc as any).auth?.admin?.createUser?.({ email: body.email, password, email_confirm: true });
        if (createRes?.error) {
          const msg = (createRes.error.message || createRes.error || '').toString();
          // If the user already exists, try to look up their id and continue.
          if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
            try {
              // Use Supabase Admin REST API to lookup user by email when admin.createUser reports already registered.
              const adminUrl = `${svcUrl.replace(/\/$/, '')}/auth/v1/admin/users?email=${encodeURIComponent(body.email)}`;
              const resp = await fetch(adminUrl, { headers: { Authorization: `Bearer ${svcKey}`, apikey: svcKey } });
              if (!resp.ok) {
                const text = await resp.text();
                return NextResponse.json({ error: `Auth user exists but admin lookup failed: ${resp.status} ${text}` }, { status: 500 });
              }
              const list = await resp.json();
              const first = Array.isArray(list) ? list[0] : list;
              const existingId = first?.id;
              if (!existingId) {
                return NextResponse.json({ error: 'Auth user exists but could not determine user id from admin lookup.' }, { status: 500 });
              }
              profileId = existingId;
            } catch (e: any) {
              return NextResponse.json({ error: `Auth user exists but admin lookup failed: ${e?.message || String(e)}` }, { status: 500 });
            }
          } else {
            return NextResponse.json({ error: `Failed to create auth user: ${msg}` }, { status: 500 });
          }
        } else {
          const newUserId = createRes?.data?.user?.id || createRes?.data?.id || createRes?.user?.id;
          if (!newUserId) {
            return NextResponse.json({ error: 'Created auth user but could not read new user id.' }, { status: 500 });
          }
          profileId = newUserId;
        }
      } catch (e: any) {
        return NextResponse.json({ error: `Failed to create auth user: ${e?.message || String(e)}` }, { status: 500 });
      }
    }

    // upsert profile with resolved id
    const profile = { id: profileId, first_name: first_name || null, last_name: last_name || null, role: role || 'employee', phone: null };
    const { data: up, error: upErr } = await svc.from('profiles').upsert(profile).select().maybeSingle();
    if (upErr) {
      console.warn('profiles upsert error (server):', upErr.message);
      if (upErr.message && upErr.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ error: 'Row-level security prevented writing to profiles. This usually means the server did not use the Supabase service-role key. Ensure `SUPABASE_SERVICE_ROLE_KEY` (server-only) is set and that you restarted the dev server after changing env vars.', diagnostics: { canSelectProfiles } }, { status: 500 });
      }
      return NextResponse.json({ error: upErr.message, diagnostics: { canSelectProfiles } }, { status: 400 });
    }
    

    // insert company_members (use the resolved profileId which matches an auth user id)
    if (company_id) {
      const { error: cmErr } = await svc.from('company_members').insert([{ company_id, user_id: profileId, role }]);
      if (cmErr) return NextResponse.json({ error: cmErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, profile: up });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
