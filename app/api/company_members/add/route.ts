import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeOptionalName,
  normalizePhone,
  normalizeUuid,
  parseJsonBody,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "company-members-add",
    limit: 10,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{
      company_id: unknown
      email: unknown
      first_name?: unknown
      last_name?: unknown
      phone?: unknown
    }>(req)

    const companyId = normalizeUuid(body.company_id, "company_id")
    await requirePrivilegedMembership(auth.service, companyId, auth.user.id)

    if (typeof body.email !== "string" || !body.email.trim()) {
      throw new Error("invalid email")
    }

    const email = body.email.trim().toLowerCase()

    const { data: userRow, error: userError } = await auth.service
      .from("users")
      .select("id, full_name, email, role")
      .eq("email", email)
      .maybeSingle()

    if (userError) return NextResponse.json({ error: userError.message || String(userError) }, { status: 400 })
    if (!userRow?.id) return NextResponse.json({ error: "user not found" }, { status: 404 })

    const { data: existing } = await auth.service
      .from("company_members")
      .select("user_id")
      .eq("company_id", companyId)
      .eq("user_id", userRow.id)
      .maybeSingle()

    if (existing?.user_id) {
      return NextResponse.json({ error: "user is already a member of this company" }, { status: 409 })
    }

    const { error: insertError } = await auth.service.from("company_members").insert({
      company_id: companyId,
      user_id: userRow.id,
      role: "employee",
    })
    if (insertError) return NextResponse.json({ error: insertError.message || String(insertError) }, { status: 400 })

    const profilePayload = {
      id: userRow.id,
      first_name: normalizeOptionalName(body.first_name, "first_name"),
      last_name: normalizeOptionalName(body.last_name, "last_name"),
      phone: normalizePhone(body.phone),
    }

    if (profilePayload.first_name || profilePayload.last_name || profilePayload.phone) {
      await auth.service.from("profiles").upsert(profilePayload, { onConflict: "id" })
    }

    return NextResponse.json({
      ok: true,
      member: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.full_name ?? userRow.email ?? userRow.id,
        role: "employee",
        startDate: new Date().toISOString(),
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === "forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
