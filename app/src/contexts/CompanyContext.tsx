"use client";

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

//company context to store company info and selected company across the app, including company members 

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
  loading?: boolean
}

export const CompanyContext = createContext<CompanyContextValue | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false)
  const [selectedId, setSelectedId] = useState<string>('')

  // Hydration-safe: load cached companies and selectedId on client after mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('companies_cache')
        if (saved) {
          try { setCompanies(JSON.parse(saved)) } catch (e) { console.warn('CompanyContext: invalid companies_cache', e) }
        }
        const stored = window.localStorage.getItem('activeCompanyId')
        if (stored) setSelectedId(stored)
      }
    } catch (e) {
      console.warn('CompanyContext: failed to load client cache', e)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    console.log('CompanyProvider effect:', { userId: user?.id ?? null, loading })
    // do nothing while auth is loading and we don't yet have a user
    if (loading && !user?.id) return
    // reset when signed out (only when not loading)
    if (!user?.id) {
      console.log('CompanyProvider effect: user missing -> resetting companies')
      setCompanies([])
      setSelectedId("")
      return
    }

    const load = async () => {
      setLoadingCompanies(true)
      if (!mounted) return
      try {
        // prefer server API to avoid client-side caching/RLS timing issues
        const resp = await fetch('/api/companies/mine', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) })
        console.log('CompanyProvider load: server response fetching companies/mine', resp)
        if (resp.ok) {
          const json = await resp.json()
          const comps = json.companies ?? []
          setCompanies(comps)
          const stored = typeof window !== 'undefined' ? window.localStorage.getItem('activeCompanyId') : null
          if (stored && comps.find((c: any) => c.id === stored)) {
            setSelectedId(stored)
          } else if (comps.length > 0) {
            setSelectedId(comps[0].id)
          } else {
            setSelectedId("")
          }
        } else {
          console.log('CompanyProvider load: server response failed, setting companies and selected to empty', resp)
          setCompanies([])
          setSelectedId("")
        }
      } catch (e) {
        console.warn('CompanyProvider load failed', e)
        setCompanies([])
        setSelectedId("")
      }
      finally {
        setLoadingCompanies(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id, loading])

  const selectCompany = (id: string) => {
    setSelectedId(id)
    try { localStorage.setItem('activeCompanyId', id) } catch (e) {}
  }

  const addCompany = (company: Company) => {
    console.log('CompanyContext.addCompany: adding', company)
    setCompanies((prev) => [...prev, company])
    setSelectedId(company.id)
    try { localStorage.setItem('activeCompanyId', company.id) } catch (e) {}
  }

  const refresh = async () => {
    if (!user?.id) return
    try {
      setLoadingCompanies(true)
      const resp = await fetch('/api/companies/mine', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) })
      if (resp.ok) {
        const json = await resp.json()
        console.log('CompanyContext.refresh: server response', json)
        setCompanies(json.companies || [])
      } else {
        setCompanies([])
      }
    } catch (e) {
      console.warn('refresh companies failed', e)
    }
    finally {
      setLoadingCompanies(false)
    }
  }

  useEffect(() => {
    console.log('CompanyContext: companies state changed', companies)
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem('companies_cache', JSON.stringify(companies)) } catch (e) { console.warn('CompanyContext: failed to write companies_cache', e) }
    }
  }, [companies])
  const selected = companies.find((c) => c.id === selectedId)

  return (
    <CompanyContext.Provider value={{ companies, selected, selectCompany, addCompany, refresh, loading: loadingCompanies }}>
      {children}
    </CompanyContext.Provider>
  )
}

// NOTE: hook `useCompany` has been moved to `app/src/hooks/useCompany.ts`
// NOTE: hook `useCompanyMembers` has been moved to `app/src/hooks/useCompanyMembers.ts`