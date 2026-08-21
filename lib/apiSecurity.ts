import { NextResponse } from "next/server"
import { createClient, type User } from "@supabase/supabase-js"

type AuthResult =
  | {
      ok: true
      user: User
      service: any
    }
  | {
      ok: false
      response: NextResponse
    }

type Membership = {
  company_id: string
  user_id: string
  role: string | null
}

const joinCodePattern = /^[A-Z0-9]{6,12}$/
const phonePattern = /^[0-9+()\-\s]{7,20}$/
const memoryRateLimits = new Map<string, { count: number; resetAt: number }>()

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function getServiceCredentials() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL

  if (!serviceKey || !url) {
    throw new Error("missing service role key or url")
  }

  if (publicKey && publicKey === serviceKey) {
    throw new Error("service role key appears to be the public anon key")
  }

  return { serviceKey, publicKey: publicKey ?? null, url }
}

export function getServiceClient() {
  const { serviceKey, url } = getServiceCredentials()
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function getPublicClient() {
  const { publicKey, url } = getServiceCredentials()
  if (!publicKey) {
    throw new Error("missing public anon key")
  }

  return createClient(url, publicKey, { auth: { persistSession: false } })
}

function extractBearerToken(req: Request) {
  const authorization = req.headers.get("authorization") || ""
  if (!authorization.toLowerCase().startsWith("bearer ")) return null
  return authorization.slice(7).trim() || null
}

function enforceSameOrigin(req: Request) {
  const origin = req.headers.get("origin")
  if (!origin) return null

  let requestOrigin: string
  try {
    requestOrigin = new URL(req.url).origin
  } catch {
    return jsonError("invalid request origin", 400)
  }

  if (origin !== requestOrigin) {
    return jsonError("cross-site requests are not allowed", 403)
  }

  return null
}

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = memoryRateLimits.get(key)

  if (!current || current.resetAt <= now) {
    memoryRateLimits.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (current.count >= limit) {
    return jsonError("too many requests", 429)
  }

  current.count += 1
  memoryRateLimits.set(key, current)
  return null
}

export async function authenticateRequest(
  req: Request,
  options: { rateLimitKey?: string; limit?: number; windowMs?: number } = {}
): Promise<AuthResult> {
  const sameOriginError = enforceSameOrigin(req)
  if (sameOriginError) return { ok: false, response: sameOriginError }

  const token = extractBearerToken(req)
  if (!token) {
    return { ok: false, response: jsonError("authentication required", 401) }
  }

  try {
    const publicClient = getPublicClient()
    const { data, error } = await publicClient.auth.getUser(token)
    if (error || !data.user) {
      return { ok: false, response: jsonError("invalid or expired session", 401) }
    }

    if (options.rateLimitKey) {
      const limited = checkRateLimit(
        `${options.rateLimitKey}:${data.user.id}`,
        options.limit ?? 30,
        options.windowMs ?? 60_000
      )
      if (limited) return { ok: false, response: limited }
    }

    return { ok: true, user: data.user, service: getServiceClient() }
  } catch (error) {
    console.error("authenticateRequest failed", error)
    return { ok: false, response: jsonError("authentication failed", 500) }
  }
}

export async function parseJsonBody<T>(req: Request) {
  try {
    return (await req.json()) as T
  } catch {
    throw new Error("invalid json body")
  }
}

export function normalizeUuid(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`invalid ${fieldName}`)
  }

  return value
}

export function normalizeOptionalName(value: unknown, fieldName: string) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string") throw new Error(`invalid ${fieldName}`)

  const normalized = value.trim().replace(/\s+/g, " ")
  if (!normalized || normalized.length > 80) throw new Error(`invalid ${fieldName}`)
  return normalized
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") throw new Error("invalid email")

  const normalized = value.trim().toLowerCase()
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("invalid email")
  }

  return normalized
}

export function normalizePhone(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string") throw new Error("invalid phone")

  const normalized = value.trim()
  if (!phonePattern.test(normalized)) throw new Error("invalid phone")
  return normalized
}

export function normalizeCompanyName(value: unknown) {
  if (typeof value !== "string") throw new Error("invalid company name")

  const normalized = value.trim().replace(/\s+/g, " ")
  if (normalized.length < 2 || normalized.length > 120) {
    throw new Error("invalid company name")
  }

  return normalized
}

export function normalizeJoinCode(value: unknown, required = true) {
  if (value === null || value === undefined || value === "") {
    if (required) throw new Error("invalid join code")
    return null
  }

  if (typeof value !== "string") throw new Error("invalid join code")

  const normalized = value.trim().toUpperCase()
  if (!joinCodePattern.test(normalized)) throw new Error("invalid join code")
  return normalized
}

export function normalizeRequestType(value: unknown) {
  if (value !== "time-off" && value !== "shift-swap") {
    throw new Error("invalid request type")
  }

  return value
}

export function normalizeRequestStatus(value: unknown) {
  if (value !== "pending" && value !== "approved" && value !== "rejected") {
    throw new Error("invalid request status")
  }

  return value
}

export function normalizeIsoDate(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`invalid ${fieldName}`)
  }

  return value
}

export function normalizeOptionalText(value: unknown, fieldName: string, maxLength = 500) {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string") throw new Error(`invalid ${fieldName}`)

  const normalized = value.trim()
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new Error(`invalid ${fieldName}`)
  }

  return normalized
}

export async function getMembership(
  service: any,
  companyId: string,
  userId: string
) {
  const { data, error } = await service
    .from("company_members")
    .select("company_id, user_id, role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export function isPrivilegedRole(role: string | null | undefined) {
  return role === "admin" || role === "manager" || role === "owner"
}

export async function requireMembership(
  service: any,
  companyId: string,
  userId: string
) {
  const membership = await getMembership(service, companyId, userId)
  if (!membership) {
    throw new Error("forbidden")
  }

  return membership
}

export async function requirePrivilegedMembership(
  service: any,
  companyId: string,
  userId: string
) {
  const membership = await requireMembership(service, companyId, userId)
  if (!isPrivilegedRole(membership.role)) {
    throw new Error("forbidden")
  }

  return membership
}
