"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCompany } from '../hooks/useCompany'

type UseRoleResult = {
  role: string | null
  isAdmin: boolean
  loading: boolean
  refresh: () => Promise<void>
}

export function useRole(): UseRoleResult {
  const { user } = useAuth()
  const { selected, refresh: refreshCompanies, loading: companiesLoading } = useCompany()
  const role = selected?.current_user_role ?? null

  const refresh = useCallback(async () => {
    if (user?.id) await refreshCompanies()
  }, [refreshCompanies, user?.id])

  return {
    role,
    isAdmin: role === 'admin',
    loading: companiesLoading,
    refresh,
  }
}

export default useRole
