import { NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/apiSecurity"

export async function GET(req: Request) {
  const auth = await authenticateRequest(req, { rateLimitKey: "shift-notifications-list", limit: 60, windowMs: 60_000 })
  if (!auth.ok) return auth.response

  try {
    const { data, error } = await auth.service
      .from("shift_notifications")
      .select("id, title, detail, message, created_at")
      .eq("recipient_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) throw error
    return NextResponse.json({ notifications: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
