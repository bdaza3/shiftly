"use client"

import { supabase } from "@/lib/supabaseClient"

const SESSION_GET_TIMEOUT = 1000

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
    return null
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const sessionResult = await tryGetSession()
  const headers = new Headers(init.headers)

  const accessToken = sessionResult?.data?.session?.access_token ?? null
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json")
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  })
}
