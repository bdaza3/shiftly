import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeUuid,
  parseJsonBody,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "company-members-remove",
    limit: 20,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{ company_id: unknown; user_id: unknown }>(req)
    const companyId = normalizeUuid(body.company_id, "company_id")
    const targetUserId = normalizeUuid(body.user_id, "user_id")

    await requirePrivilegedMembership(auth.service, companyId, auth.user.id)

    if (targetUserId === auth.user.id) {
      return NextResponse.json({ error: "cannot remove your own membership from this endpoint" }, { status: 400 })
    }

    const { error } = await auth.service
      .from("company_members")
      .delete()
      .match({ company_id: companyId, user_id: targetUserId })

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === "forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
