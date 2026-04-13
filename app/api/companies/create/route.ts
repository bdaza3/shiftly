import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  authenticateRequest,
  normalizeCompanyName,
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
    console.warn("companies/create ensureProfile: auth lookup failed", error)
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
    rateLimitKey: "companies-create",
    limit: 5,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{
      name: unknown
      join_code?: unknown
      first_name?: unknown
      last_name?: unknown
      phone?: unknown
    }>(req)

    const companyName = normalizeCompanyName(body.name)
    const joinCode = normalizeJoinCode(body.join_code, false)
    const firstName = normalizeOptionalName(body.first_name, "first_name")
    const lastName = normalizeOptionalName(body.last_name, "last_name")
    const phone = normalizePhone(body.phone)

    await ensureProfile(auth.service, auth.user.id, {
      first_name: firstName,
      last_name: lastName,
      phone,
    })

    const { data: company, error: createErr } = await auth.service
      .from("companies")
      .insert({
        name: companyName,
        join_code: joinCode,
      })
      .select()
      .single()

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 })
    }

    const { error: memberErr } = await auth.service.from("company_members").insert({
      company_id: company.id,
      user_id: auth.user.id,
      role: "admin",
    })

    if (memberErr) {
      return NextResponse.json({ error: memberErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, company: { ...company, current_user_role: "admin" } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
