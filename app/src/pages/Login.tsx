"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCompany } from "../hooks/useCompany";
import React from "react";

export function Login() {
  const { signIn, user, loading, refreshProfile } = useAuth()
  const { refresh: refreshCompanies } = useCompany()
  const router = useRouter();
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [redirectPending, setRedirectPending] = React.useState(false)

  React.useEffect(() => {
    if (loading || !user?.id || !redirectPending) return
    let cancelled = false

    const finishRedirect = async () => {
      try {
        const withTimeout = async (p: Promise<any>, ms = 3000) =>
          Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

        try { await withTimeout(refreshProfile(), 3000) } catch (e) { console.warn('refreshProfile timed out or failed', e) }
        try { await withTimeout(refreshCompanies(), 3000) } catch (e) { console.warn('refreshCompanies timed out or failed', e) }
      } catch (error) {
        console.warn("Login redirect sync failed", error)
      }

      if (cancelled) return
      router.replace("/dashboard")
      router.refresh()
    }

    finishRedirect()

    return () => {
      cancelled = true
    }
  }, [loading, redirectPending, refreshCompanies, refreshProfile, router, user?.id])

  React.useEffect(() => {
    if (loading || !user?.id || redirectPending) return
    router.replace("/dashboard")
  }, [loading, redirectPending, router, user?.id])

  const handleSignIn = async () => {
    setSubmitting(true)
    try {
      const res = await signIn(email, password)
      console.log('Login.handleSignIn: signIn result', res)
      if (res.error) {
        alert(res.error.message)
        setRedirectPending(false)
        return
      }
      setRedirectPending(true)

      // Attempt to refresh profile/companies but don't block the redirect.
      ;(async () => {
        const withTimeout = async (p: Promise<any>, ms = 3000) =>
          Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
        try { await withTimeout(refreshProfile(), 3000) } catch (e) { console.warn('refreshProfile timed out or failed (post-signin)', e) }
        try { await withTimeout(refreshCompanies(), 3000) } catch (e) { console.warn('refreshCompanies timed out or failed (post-signin)', e) }
      })()

      try {
        router.replace('/dashboard')
        router.refresh()
      } catch (e) {
        console.warn('Login: navigate failed', e)
      }
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to sign in"
      alert(message)
      setRedirectPending(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Shiftly</h1>
            <p className="text-gray-500">Spend less time on scheduling, more time with your team.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                suppressHydrationWarning={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                suppressHydrationWarning={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <button onClick={handleSignIn}
              type="button"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              {submitting ? "Signing In..." : "Sign In"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/signup" className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline hover:cursor-pointer">
              Don&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
