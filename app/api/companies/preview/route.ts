import { NextResponse } from "next/server"
import { authenticateRequest, normalizeJoinCode, parseJsonBody } from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "companies-preview",
    limit: 20,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{ join_code: unknown }>(req)
    const joinCode = normalizeJoinCode(body.join_code)

    const { data, error } = await auth.service
      .from("companies")
      .select("id, name, industry")
      .eq("join_code", joinCode)
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })
    if (!data) return NextResponse.json({ error: "company not found" }, { status: 404 })

    return NextResponse.json({ ok: true, company: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
