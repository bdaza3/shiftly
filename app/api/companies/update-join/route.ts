import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeJoinCode,
  normalizeUuid,
  parseJsonBody,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "companies-update-join",
    limit: 20,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{ company_id: unknown; join_code?: unknown }>(req)
    const companyId = normalizeUuid(body.company_id, "company_id")
    const joinCode = normalizeJoinCode(body.join_code, false)

    await requirePrivilegedMembership(auth.service, companyId, auth.user.id)

    const { data, error } = await auth.service
      .from("companies")
      .update({ join_code: joinCode })
      .eq("id", companyId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })
    return NextResponse.json({ ok: true, company: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === "forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
