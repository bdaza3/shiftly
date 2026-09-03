import { NextResponse } from "next/server"
import {
  authenticateRequest,
  normalizeUuid,
  parseJsonBody,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "company-members-list",
    limit: 30,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{ company_id: unknown }>(req)
    const companyId = normalizeUuid(body.company_id, "company_id")

    await requirePrivilegedMembership(auth.service, companyId, auth.user.id)

    const { data: rows, error } = await auth.service
      .from("company_members")
      .select("user_id, role, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message || String(error) }, { status: 400 })

    const memberRows = rows || []
    const userIds = memberRows.map((row: { user_id?: string }) => row.user_id).filter(Boolean)
    let profiles: Array<{ id: string; first_name?: string | null; last_name?: string | null; phone?: string | null }> = []
    let users: Array<{ id: string; full_name?: string | null; email?: string | null }> = []

    if (userIds.length > 0) {
      const [profileResult, userResult] = await Promise.all([
        auth.service
          .from("profiles")
          .select("id, first_name, last_name, phone")
          .in("id", userIds),
        auth.service
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds),
      ])

      if (!profileResult.error) profiles = profileResult.data || []
      if (!userResult.error) users = userResult.data || []
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]))
    const userMap = new Map(users.map((user) => [user.id, user]))

    const members = memberRows.map((row: { user_id: string; role?: string | null; created_at?: string }) => {
      const profile = profileMap.get(row.user_id)
      const user = userMap.get(row.user_id)
      const name =
        profile && (profile.first_name || profile.last_name)
          ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
          : user?.full_name ?? user?.email ?? row.user_id

      return {//member object to return
        id: row.user_id,
        role: row.role,
        startDate: row.created_at,
        name,
        email: user?.email ?? null,
        phone: profile?.phone ?? null,
        avatarUrl: null,
      }
    })

    return NextResponse.json({ ok: true, members })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const status = message === "forbidden" ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
