import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeCompanyName,
  normalizeOptionalText,
  normalizePhone,
  normalizeUuid,
  parseJsonBody,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "companies-update",
    limit: 20,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{
      company_id: unknown
      name: unknown
      timezone?: unknown
      industry?: unknown
      size?: unknown
      default_shift_length?: unknown
      address?: unknown
      phone?: unknown
      website?: unknown
    }>(req)

    const companyId = normalizeUuid(body.company_id, "company_id")
    await requirePrivilegedMembership(auth.service, companyId, auth.user.id)

    const timezone = normalizeOptionalText(body.timezone, "timezone", 64)
    const industry = normalizeOptionalText(body.industry, "industry", 80)
    const size = normalizeOptionalText(body.size, "size", 32)
    const address = normalizeOptionalText(body.address, "address", 200)
    const website = normalizeOptionalText(body.website, "website", 200)
    const phone = normalizePhone(body.phone)

    let defaultShiftLength: number | null = null
    if (body.default_shift_length !== undefined && body.default_shift_length !== null && body.default_shift_length !== "") {
      const parsed = Number(body.default_shift_length)
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 24) {
        throw new Error("invalid default shift length")
      }
      defaultShiftLength = parsed
    }

    const { data, error } = await auth.service
      .from("companies")
      .update({
        name: normalizeCompanyName(body.name),
        timezone,
        industry,
        size,
        default_shift_length: defaultShiftLength,
        address,
        phone,
        website,
      })
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
