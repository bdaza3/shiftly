import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import {
  authenticateRequest,
  normalizeEmail,
  normalizeUuid,
  parseJsonBody,
  requirePrivilegedMembership,
} from "@/lib/apiSecurity"

function getAppUrl(req: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(req: Request) {
  const auth = await authenticateRequest(req, {
    rateLimitKey: "company-members-invite",
    limit: 10,
    windowMs: 60_000,
  })
  if (!auth.ok) return auth.response

  try {
    const body = await parseJsonBody<{ company_id: unknown; email: unknown }>(req)
    const companyId = normalizeUuid(body.company_id, "company_id")
    const email = normalizeEmail(body.email)
    await requirePrivilegedMembership(auth.service, companyId, auth.user.id)

    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL
    if (!resendApiKey || !fromEmail) {
      return NextResponse.json({ error: "email service is not configured" }, { status: 500 })
    }

    const { data: company, error: companyError } = await auth.service
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .single()
    if (companyError || !company) {
      return NextResponse.json({ error: companyError?.message || "company not found" }, { status: 404 })
    }

    const { data: existingMember } = await auth.service
      .from("company_members")
      .select("user_id")
      .eq("company_id", companyId)
      .eq("user_id", auth.user.id)
      .maybeSingle()

    if (!existingMember) return NextResponse.json({ error: "forbidden" }, { status: 403 })

    await auth.service
      .from("company_invitations")
      .update({ expires_at: new Date().toISOString() })
      .eq("company_id", companyId)
      .eq("invited_email", email)
      .is("accepted_at", null)

    const token = randomBytes(32).toString("hex")
    const { error: insertError } = await auth.service.from("company_invitations").insert({
      company_id: companyId,
      invited_email: email,
      invited_by: auth.user.id,
      role: "employee",
      token_hash: hashToken(token),
    })
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

    const inviteUrl = `${getAppUrl(req)}/register?invite=${encodeURIComponent(token)}`
    const resend = new Resend(resendApiKey)
    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You have been invited to join ${company.name} on Shiftly`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033;max-width:560px;margin:auto">
          <h1 style="color:#2563eb">Join ${company.name} on Shiftly</h1>
          <p>You have been invited to join <strong>${company.name}</strong> as an employee.</p>
          <p><a href="${inviteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 18px;border-radius:6px;text-decoration:none">Accept invitation</a></p>
          <p>This invitation expires in 7 days and can only be used once.</p>
        </div>
      `,
    })

    if (emailError) {
      await auth.service.from("company_invitations").delete().eq("token_hash", hashToken(token))
      return NextResponse.json({ error: emailError.message || "failed to send invitation email" }, { status: 502 })
    }

    return NextResponse.json({ ok: true, invited_email: email, expires_in_days: 7 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: message === "forbidden" ? 403 : 400 })
  }
}
