import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  authenticateRequest,
  normalizeJoinCode,
  normalizeOptionalName,
  normalizePhone,
  parseJsonBody,
} from "@/lib/apiSecurity"

type ProfileInput = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
}

type AuthMetadata = {
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  phone?: string
}

async function ensureProfile(
  svc: ReturnType<typeof createClient>,
  userId: string,
  profileInput: ProfileInput
) {
  let metadata: AuthMetadata = {}

  try {
    const { data, error } = await svc.auth.admin.getUserById(userId)
    if (!error) metadata = data?.user?.user_metadata ?? {}
  } catch (error) {
    console.warn("companies/join ensureProfile: auth lookup failed", error)
  }

  const payload: { id: string; first_name?: string; last_name?: string; phone?: string } = { id: userId }
  const firstName = profileInput.first_name ?? metadata.firstName ?? metadata.first_name
  const lastName = profileInput.last_name ?? metadata.lastName ?? metadata.last_name
  const phone = profileInput.phone ?? metadata.phone

  if (firstName) payload.first_name = firstName
  if (lastName) payload.last_name = lastName
  if (phone) payload.phone = phone

  const { error } = await (svc as any).from("profiles").upsert(payload, { onConflict: "id" })
  if (error) throw error
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "companies-join",
    limit: 10,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{
      join_code: unknown
      first_name?: unknown
      last_name?: unknown
      phone?: unknown
    }>(req)

    const joinCode = normalizeJoinCode(body.join_code)
    const firstName = normalizeOptionalName(body.first_name, "first_name")
    const lastName = normalizeOptionalName(body.last_name, "last_name")
    const phone = normalizePhone(body.phone)

    const { data: company, error: findErr } = await auth.service
      .from("companies")
      .select("*")
      .eq("join_code", joinCode)
      .limit(1)
      .maybeSingle()

    if (findErr) return NextResponse.json({ error: findErr.message || String(findErr) }, { status: 400 })
    if (!company) return NextResponse.json({ error: "company not found" }, { status: 404 })

    await ensureProfile(auth.service, auth.user.id, {
      first_name: firstName,
      last_name: lastName,
      phone,
    })

    const { data: existing, error: exErr } = await auth.service
      .from("company_members")
      .select("*")
      .eq("company_id", company.id)
      .eq("user_id", auth.user.id)
      .limit(1)

    if (exErr) return NextResponse.json({ error: exErr.message || String(exErr) }, { status: 400 })

    let role = existing?.[0]?.role ?? null
    if (!existing || existing.length === 0) {
      const { error: insErr } = await auth.service
        .from("company_members")
        .insert({ company_id: company.id, user_id: auth.user.id, role: "employee" })
      if (insErr) return NextResponse.json({ error: insErr.message || String(insErr) }, { status: 400 })
      role = "employee"
    }

    return NextResponse.json({ ok: true, company: { ...company, current_user_role: role ?? "employee" } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
