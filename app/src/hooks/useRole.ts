"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'
import { authFetch } from '@/lib/authFetch'

type UseRoleResult = {
  role: string | null
  isAdmin: boolean
  loading: boolean
  refresh: () => Promise<void>
}

export function useRole(): UseRoleResult {
  const { user } = useAuth()
  const { selected } = useCompany()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRole = useCallback(async () => {
    if (!user?.id || !selected?.id) {
      setRole(null)
      return
    }
    setLoading(true)
    try {
      const resp = await authFetch('/api/company_members/get', {
        method: 'POST',
        body: JSON.stringify({ company_id: selected.id, user_id: user.id }),
        cache: 'no-store',
      })
      if (!resp.ok) {
        console.warn('useRole: company_members/get failed', resp.status)
        setRole(null)
        return
      }
      const json = await resp.json()
      const membership = json?.membership
      setRole(membership?.role ?? null)
    } catch (e) {
      console.warn('useRole: fetch error', e)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, selected?.id])

  useEffect(() => {
    let mounted = true
    if (!user?.id || !selected?.id) {
      setRole(null)
      return
    }
    // fire-and-forget but avoid setting state if unmounted
    (async () => {
      if (!mounted) return
      await fetchRole()
    })()
    return () => { mounted = false }
  }, [fetchRole, user?.id, selected?.id])

  return {
    role,
    isAdmin: role === 'admin',
    loading,
    refresh: fetchRole,
  }
}

export default useRole
