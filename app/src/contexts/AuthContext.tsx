"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

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
          try {
            const { data: p, error } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
            if (error) throw error
            setProfile(p ?? null)
          } catch (e) {
            console.warn('AuthContext: initial profiles read failed', e)
            setProfile(null)
          }
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
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      try {
        const u = session?.user ?? null
        console.log('AuthContext.onAuthStateChange', _event, !!u, u?.id)
        setUser(u)
        if (u?.id) {
          try {
            const { data: p, error } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
            if (error) throw error
            setProfile(p ?? null)
          } catch (e) {
            console.warn('AuthContext.onAuthStateChange: profiles read failed', e)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
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
      try { subscription?.unsubscribe() } catch (e) { console.warn('AuthContext: unsubscribe failed', e) }
    }
  }, [])

  const refreshProfile = async () => {
    console.log('AuthContext.refreshProfile: start')
    try {
      const s = await supabase.auth.getSession();
      const u = (s as any)?.data?.session?.user ?? null;
      console.log('AuthContext.refreshProfile: session user', u)
      setUser(u);
      if (u?.id) {
        try {
          const { data: p, error } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
          if (error) throw error
          console.log('AuthContext.refreshProfile: profile from client', p)
          setProfile(p ?? null);
        } catch (e) {
          console.warn('AuthContext.refreshProfile: client profiles read failed, falling back to server API', e)
          try {
            const resp = await fetch('/api/profiles/get', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: u.id }) })
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
        setProfile(null);
      }
    } catch (e) {
      console.warn('AuthContext.refreshProfile: failed', e)
      setProfile(null);
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
    try {
      const res = await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return res;
    } catch (err) {
      console.warn("AuthContext signOut error", err);
      setUser(null);
      setProfile(null);
      throw err;
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, userloading: loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
