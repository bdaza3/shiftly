import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeIsoDate,
  normalizeOptionalText,
  normalizeRequestType,
  normalizeUuid,
  parseJsonBody,
  requireMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "requests-create",
    limit: 20,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{
      employee_name?: unknown
      employeeName?: unknown
      type: unknown
      date: unknown
      details?: unknown
      reason?: unknown
      company_id: unknown
    }>(req)

    const companyId = normalizeUuid(body.company_id, "company_id")
    await requireMembership(auth.service, companyId, auth.user.id)

    const row = {
      requester_id: auth.user.id,
      employee_name: normalizeOptionalText(body.employee_name ?? body.employeeName, "employee_name", 120),
      type: normalizeRequestType(body.type),
      date: normalizeIsoDate(body.date, "date"),
      details: normalizeOptionalText(body.details ?? body.reason, "details", 500),
      status: "pending",
      company_id: companyId,
    }

    const { data, error } = await auth.service.from("requests").insert([row]).select().single()
    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })

    return NextResponse.json({ ok: true, request: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === "forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
