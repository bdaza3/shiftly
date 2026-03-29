import { NextResponse } from 'next/server';

export async function GET() {
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const svcUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;

  const payload = {
    svcKeyPresent: !!svcKey,
    svcUrlPresent: !!svcUrl,
    anonKeyPresent: !!anonKey,
    svcKeyMatchesAnon: !!(svcKey && anonKey && svcKey === anonKey),
  };

  return NextResponse.json(payload);
}
