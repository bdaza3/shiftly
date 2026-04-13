import { NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "companies-mine",
    limit: 60,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const { data, error } = await auth.service
      .from("company_members")
      .select("role, companies(*)")
      .eq("user_id", auth.user.id)

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })

    const companies = ((data || []) as Array<{ role?: string | null; companies?: Record<string, unknown> | null }>)
      .map((row) =>
        row.companies ? { ...row.companies, current_user_role: row.role ?? null } : null
      )
      .filter(Boolean)

    return NextResponse.json({ ok: true, companies })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
