"use client"

import React, { createContext, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'

type AuthContextValue = {
  user: any | null
  profile?: any | null
  loading: boolean
  // legacy alias used in some components
  userloading?: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  refreshProfile: () => Promise<void>
  syncLocalAuth: (payload: { profile?: any | null; userMetadata?: Record<string, any> | null }) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const clearAuthState = () => {
    setUser(null)
    setProfile(null)
    setLoading(false)
  }
  const syncLocalAuth = ({ profile: nextProfile, userMetadata }: { profile?: any | null; userMetadata?: Record<string, any> | null }) => {
    if (nextProfile !== undefined) setProfile(nextProfile)
    if (userMetadata) {
      setUser((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          user_metadata: {
            ...(prev.user_metadata ?? {}),
            ...userMetadata,
          },
        }
      })
    }
  }

  const loadProfile = async (userId: string, source: string) => {
    try {
      const { data: nextProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      setProfile(nextProfile ?? null)
    } catch (error) {
      console.warn(`AuthContext.${source}: profiles read failed`, error)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      console.log('AuthContext: init getSession')
      try {
        const { data } = await supabase.auth.getSession()
        if (!mounted) return
        const u = (data as any)?.session?.user ?? null
        console.log('AuthContext: getSession result', !!u, u?.id)
        setUser(u)
        if (u?.id) {
          await loadProfile(u.id, 'initial')
        } else {
          setProfile(null)
        }
      } catch (e) {
        console.warn('AuthContext: getSession failed', e)
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) setLoading(false)
        console .log('AuthContext: init done, loading false')
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      try {
        const u = session?.user ?? null
        console.log('AuthContext.onAuthStateChange', _event, !!u, u?.id)
        setUser(u)
        // Do not await Supabase queries inside this callback: auth holds an
        // internal lock while notifying listeners.
        if (u?.id) setTimeout(() => { if (mounted) void loadProfile(u.id, 'onAuthStateChange') }, 0)
        else setProfile(null)
      } catch (e) {
        console.warn('AuthContext.onAuthStateChange handler failed', e)
        setUser(null)
        setProfile(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })

    const subscription = (data as any)?.subscription
    return () => {
      mounted = false
      console.log('AuthContext: mounted false, unsubscribing from auth changes')
      try { subscription?.unsubscribe() } catch (e) { console.warn('AuthContext: unsubscribe failed', e) }
    }
  }, [])

  const refreshProfile = async () => {
    console.log('AuthContext.refreshProfile: start')
    const GET_SESSION_TIMEOUT = 3000
    const withTimeout = <T,>(promise: Promise<T>, timeout: number, label: string) =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), timeout)),
      ])

    try {
      let s: any = null
      try {
        s = await withTimeout(supabase.auth.getSession(), GET_SESSION_TIMEOUT, 'supabase.auth.getSession')
      } catch (e) {
        console.warn('AuthContext.refreshProfile: getSession timed out or failed', e)
        // don't clear existing user/profile on transient getSession failures; try getUser fallback
        try {
          const gu = await withTimeout(supabase.auth.getUser(), 2000, 'supabase.auth.getUser')
          s = { data: { user: (gu as any)?.data?.user ?? null } }
          console.log('AuthContext.refreshProfile: getUser fallback success', (s as any)?.data?.user?.id)
        } catch (e2) {
          console.warn('AuthContext.refreshProfile: getUser fallback failed', e2)
          console.log('AuthContext.refreshProfile: done')
          return
        }
      }

      const u = (s as any)?.data?.session?.user ?? (s as any)?.data?.user ?? null
      console.log('AuthContext.refreshProfile: session user', u)
      setUser(u)
      if (u?.id) {
        try {
          const { data: p, error } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
          if (error) throw error
          console.log('AuthContext.refreshProfile: profile from client', p)
          setProfile(p ?? null)
        } catch (e) {
          console.warn('AuthContext.refreshProfile: client profiles read failed, falling back to server API', e)
          try {
            const resp = await authFetch('/api/profiles/get', { method: 'POST', body: JSON.stringify({}) })
            const json = await resp.json()
            console.log('AuthContext.refreshProfile: server profile response', resp.status, json)
            if (resp.ok && json?.profile) setProfile(json.profile)
            else setProfile(null)
          } catch (e2) {
            console.warn('AuthContext.refreshProfile: server fallback failed', e2)
            setProfile(null)
          }
        }
      } else {
        setProfile(null)
      }
    } catch (e) {
      console.warn('AuthContext.refreshProfile: failed', e)
      setProfile(null)
    } finally {
      console.log('AuthContext.refreshProfile: done')
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext.signIn: start', { email })
    try {
      const res = await supabase.auth.signInWithPassword({ email, password })
      console.log('AuthContext.signIn: result', res)
      return res
    } catch (e) {
      console.warn('AuthContext.signIn: error', e)
      throw e
    }
  }

  const signUp = async (email: string, password: string) => {
    console.log('AuthContext.signUp: start', { email })
    try {
      const res = await supabase.auth.signUp({ email, password })
      console.log('AuthContext.signUp: result', res)
      return res
    } catch (e) {
      console.warn('AuthContext.signUp: error', e)
      throw e
    }
  }

  const signOut = async () => {
    clearAuthState()
    try {
      const res = await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('supabase.auth.signOut timeout')), 5000)),
      ])
      return res;
    } catch (err) {
      console.warn("AuthContext signOut error", err);
      throw err;
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, userloading: loading, signIn, signUp, signOut, refreshProfile, syncLocalAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

// NOTE: hook `useAuth` has been moved to `app/src/hooks/useAuth.ts`
