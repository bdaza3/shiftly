import { NextResponse } from "next/server"
import {
  authenticateRequest,
  isPrivilegedRole,
  normalizeUuid,
  parseJsonBody,
  requireMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "requests-list",
    limit: 60,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{ company_id: unknown }>(req)
    const companyId = normalizeUuid(body.company_id, "company_id")
    const membership = await requireMembership(auth.service, companyId, auth.user.id)

    let query = auth.service.from("requests").select("*").eq("company_id", companyId).order("created_at", {
      ascending: false,
    })

    if (!isPrivilegedRole(membership.role)) {
      query = query.eq("requester_id", auth.user.id)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })

    return NextResponse.json({ ok: true, requests: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === "forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
