import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeIsoDate,
  normalizeOptionalText,
  normalizeUuid,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

type Body = {
  company_id: unknown
  shift_id: unknown
  recipient_ids: unknown
  date: unknown
  start_time: unknown
  end_time: unknown
  message?: unknown
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, { rateLimitKey: "shift-notifications-create", limit: 30, windowMs: 60_000 })
  if (!auth.ok) return auth.response

  try {
    const body = await req.json() as Body
    const companyId = normalizeUuid(body.company_id, "company_id")
    const shiftId = normalizeUuid(body.shift_id, "shift_id")
    const date = normalizeIsoDate(body.date, "date")
    const message = normalizeOptionalText(body.message, "message", 500)
    if (typeof body.start_time !== "string" || typeof body.end_time !== "string") throw new Error("invalid shift time")
    if (!Array.isArray(body.recipient_ids) || body.recipient_ids.length === 0 || body.recipient_ids.length > 100) throw new Error("invalid recipients")

    await requirePrivilegedMembership(auth.service, companyId, auth.user.id)
    const recipientIds = [...new Set(body.recipient_ids.map((id) => normalizeUuid(id, "recipient_id")))]
    const { data: memberships, error: membersError } = await auth.service
      .from("company_members")
      .select("user_id")
      .eq("company_id", companyId)
      .in("user_id", recipientIds)
    if (membersError) throw membersError
    if ((memberships || []).length !== recipientIds.length) throw new Error("recipient is not a company member")

    const title = "You were assigned a shift"
    const detail = `${date} · ${body.start_time}–${body.end_time}${message ? ` · ${message}` : ""}`
    const { error } = await auth.service.from("shift_notifications").insert(
      recipientIds.map((recipientId) => ({
        company_id: companyId,
        recipient_id: recipientId,
        shift_id: shiftId,
        title,
        detail,
        message,
      }))
    )
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: message === "forbidden" ? 403 : 400 })
  }
}
