import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeRequestStatus,
  normalizeUuid,
  parseJsonBody,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "requests-update",
    limit: 30,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{ id: unknown; status: unknown }>(req)
    const requestId = normalizeUuid(body.id, "id")
    const status = normalizeRequestStatus(body.status)

    const { data: requestRow, error: requestError } = await auth.service
      .from("requests")
      .select("id, company_id")
      .eq("id", requestId)
      .single()

    if (requestError || !requestRow?.company_id) {
      return NextResponse.json({ error: "request not found" }, { status: 404 })
    }

    await requirePrivilegedMembership(auth.service, requestRow.company_id, auth.user.id)

    const { data, error } = await auth.service
      .from("requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })

    return NextResponse.json({ ok: true, request: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === "forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
