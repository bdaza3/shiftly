import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeOptionalName,
  normalizePhone,
  parseJsonBody,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "profiles-upsert",
    limit: 15,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{
      first_name?: unknown
      last_name?: unknown
      phone?: unknown
    }>(req)

    const payload = {
      id: auth.user.id,
      first_name: normalizeOptionalName(body.first_name, "first_name"),
      last_name: normalizeOptionalName(body.last_name, "last_name"),
      phone: normalizePhone(body.phone),
    }

    const { data, error } = await auth.service
      .from("profiles")
      .upsert(payload)
      .select()
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })
    return NextResponse.json({ ok: true, profile: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
