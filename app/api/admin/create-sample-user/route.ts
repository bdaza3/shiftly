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

    // upsert profile
    const profile = { id, first_name: first_name || null, last_name: last_name || null, role: role || 'employee', phone: null };
    const { data: up, error: upErr } = await svc.from('profiles').upsert(profile).select().maybeSingle();
    if (upErr) {
      console.warn('profiles upsert error (server):', upErr.message);
      // If FK violation (profiles.id references auth.users) and we have an email, attempt to create an auth user
      if (upErr.message && upErr.message.toLowerCase().includes('foreign key')) {
        if (body.email) {
          try {
            const password = 'TempPass!' + Math.floor(Math.random() * 90000 + 10000);
            // Attempt to create an auth user via admin API
            // Note: admin API may return user as data.user or data
            const createRes: any = await (svc as any).auth?.admin?.createUser?.({ email: body.email, password, email_confirm: true });
            if (createRes?.error) {
              return NextResponse.json({ error: `Failed to create auth user: ${createRes.error.message || createRes.error}` }, { status: 500 });
            }
            const newUserId = createRes?.data?.user?.id || createRes?.data?.id || createRes?.user?.id;
            if (!newUserId) {
              return NextResponse.json({ error: 'Created auth user but could not read new user id.' }, { status: 500 });
            }
            // retry upsert with new user id
            const profile2 = { ...profile, id: newUserId };
            const { data: up2, error: upErr2 } = await svc.from('profiles').upsert(profile2).select().maybeSingle();
            if (upErr2) return NextResponse.json({ error: upErr2.message }, { status: 500 });
            // also insert company_members if requested
            if (company_id) {
              const { error: cmErr } = await svc.from('company_members').insert([{ company_id, user_id: newUserId, role }]);
              if (cmErr) return NextResponse.json({ error: cmErr.message }, { status: 400 });
            }
            return NextResponse.json({ ok: true, profile: up2, createdUserId: newUserId });
          } catch (e: any) {
            return NextResponse.json({ error: `Failed to create auth user: ${e?.message || String(e)}` }, { status: 500 });
          }
        }
      }
      if (upErr.message && upErr.message.toLowerCase().includes('row-level security')) {
        return NextResponse.json({ error: 'Row-level security prevented writing to profiles. This usually means the server did not use the Supabase service-role key. Ensure `SUPABASE_SERVICE_ROLE_KEY` (server-only) is set and that you restarted the dev server after changing env vars.', diagnostics: { canSelectProfiles } }, { status: 500 });
      }
      return NextResponse.json({ error: upErr.message, diagnostics: { canSelectProfiles } }, { status: 400 });
    }
    

    // insert company_members
    if (company_id) {
      const { error: cmErr } = await svc.from('company_members').insert([{ company_id, user_id: id, role }]);
      if (cmErr) return NextResponse.json({ error: cmErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, profile: up });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
