"use client"

import { supabase } from "@/lib/supabaseClient"

const SESSION_GET_TIMEOUT = 5000

async function tryGetSession(timeout = SESSION_GET_TIMEOUT) {
  try {
    const promise = supabase.auth.getSession()
    const res = await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('supabase.auth.getSession timeout')), timeout)),
    ])
    return res as any
  } catch (e) {
    console.warn('authFetch: supabase.auth.getSession failed or timed out', e)
    // Remove an expired refresh token so protected requests do not repeat
    // the same failed session refresh attempt.
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (signOutError) {
      console.warn('authFetch: failed to clear local auth session', signOutError)
    }
    return null
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const sessionResult = await tryGetSession()
  const headers = new Headers(init.headers)

  const accessToken = sessionResult?.data?.session?.access_token ?? null
  if (!accessToken) return new Response(JSON.stringify({ error: "authentication required" }), {
    status: 401,
    headers: { "content-type": "application/json" },
  })

  headers.set("authorization", `Bearer ${accessToken}`)

  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  })
}
