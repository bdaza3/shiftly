"use client";

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from './AuthContext'

type Team = { id: string; name: string; manager: string; members: number }
export type Company = {
  id: string
  name: string
  address?: string
  owner?: string
  website?: string
  join_code?: string
  teams?: Team[]
}

type CompanyContextValue = {
  companies: Company[]
  selected?: Company
  selectCompany: (id: string) => void
  addCompany: (c: Company) => void
  refresh: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedId, setSelectedId] = useState<string>(() => {
    try {
      return typeof window !== 'undefined' ? (localStorage.getItem('activeCompanyId') ?? '') : ''
    } catch (e) {
      return ''
    }
  })

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user?.id) {
        setCompanies([])
        return
      }
      try {
        const { data: memberships } = await supabase.from('company_members').select('company_id').eq('user_id', user.id)
        const ids = (memberships || []).map((m: any) => m.company_id).filter(Boolean)
        if (ids.length === 0) {
          if (mounted) setCompanies([])
          return
        }
        const { data: comps } = await supabase.from('companies').select('*').in('id', ids)
        if (mounted) setCompanies(comps || [])
        // if selectedId is empty, pick first or use stored
        if (mounted && !selectedId && (comps && comps.length)) {
          const pick = comps[0].id
          setSelectedId(pick)
          try { localStorage.setItem('activeCompanyId', pick) } catch(e){}
        }
      } catch (e) {
        console.warn('failed loading companies', e)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id])

  const selectCompany = (id: string) => {
    setSelectedId(id)
    try { localStorage.setItem('activeCompanyId', id) } catch (e) {}
  }

  const addCompany = (company: Company) => {
    setCompanies((prev) => [...prev, company])
    setSelectedId(company.id)
    try { localStorage.setItem('activeCompanyId', company.id) } catch (e) {}
  }

  const refresh = async () => {
    if (!user?.id) return
    try {
      const { data: memberships } = await supabase.from('company_members').select('company_id').eq('user_id', user.id)
      const ids = (memberships || []).map((m: any) => m.company_id).filter(Boolean)
      if (ids.length === 0) {
        setCompanies([])
        return
      }
      const { data: comps } = await supabase.from('companies').select('*').in('id', ids)
      setCompanies(comps || [])
    } catch (e) {
      console.warn('refresh companies failed', e)
    }
  }

  const selected = companies.find((c) => c.id === selectedId)

  return (
    <CompanyContext.Provider value={{ companies, selected, selectCompany, addCompany, refresh }}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}
