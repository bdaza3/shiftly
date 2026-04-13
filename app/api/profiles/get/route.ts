import { NextResponse } from "next/server"
import { authenticateRequest, parseJsonBody } from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "profiles-get",
    limit: 60,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    await parseJsonBody<Record<string, never>>(req)
    const { data, error } = await auth.service
      .from("profiles")
      .select("*")
      .eq("id", auth.user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })
    return NextResponse.json({ ok: true, profile: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
