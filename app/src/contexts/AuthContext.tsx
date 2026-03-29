'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

type AuthContextValue = {
  user: any | null
  profile?: any | null
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      const u = data.session?.user ?? null
      setUser(u)
      if (u?.id) {
        try {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
          setProfile(p ?? null)
        } catch (e) {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    })

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!mounted) return
    const u = session?.user ?? null
    setUser(u)
    if (u?.id) {
      try {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
        setProfile(p ?? null)
      } catch (e) {
        setProfile(null)
      }
    } else {
      setProfile(null)
    }
    })
    const subscription = data?.subscription
    // cleanup:
    return () => {
    mounted = false
    subscription?.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    try {
      const s = await supabase.auth.getSession();
      const u = s?.data?.session?.user ?? null;
      setUser(u);
      if (u?.id) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        setProfile(p ?? null);
      } else {
        setProfile(null);
      }
    } catch (e) {
      setProfile(null);
    }
  }

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = async () => {
    try {
      const res = await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return res;
    } catch (err) {
      console.warn("AuthContext signOut error", err);
      // ensure local state cleared even on error
      setUser(null);
      setProfile(null);
      throw err;
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}