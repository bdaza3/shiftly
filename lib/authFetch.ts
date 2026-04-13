"use client"

import { supabase } from "@/lib/supabaseClient"

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const headers = new Headers(init.headers)

  if (data.session?.access_token) {
    headers.set("authorization", `Bearer ${data.session.access_token}`)
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
