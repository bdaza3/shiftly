"use client";

import React, { createContext, useContext, useState } from 'react'

type Team = { id: string; name: string; manager: string; members: number }
export type Company = {
  id: string
  name: string
  address?: string
  owner?: string
  website?: string
  teams?: Team[]
}

const sampleCompanies: Company[] = [
  {
    id: 'c1',
    name: 'Shiftly HQ',
    address: '123 Main St, Townsville',
    owner: 'Alice CEO',
    website: 'https://shiftly.example',
    teams: [
      { id: 't1', name: 'Retail', manager: 'Bob', members: 12 },
      { id: 't2', name: 'Support', manager: 'Carmen', members: 5 },
    ],
  },
  {
    id: 'c2',
    name: 'North Branch',
    address: '456 Side Rd, Villagetown',
    owner: 'Dan Owner',
    website: '',
    teams: [{ id: 't3', name: 'Warehouse', manager: 'Eve', members: 7 }],
  },
]

type CompanyContextValue = {
  companies: Company[]
  selected?: Company
  selectCompany: (id: string) => void
  addCompany: (c: Company) => void
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(sampleCompanies)
  const [selectedId, setSelectedId] = useState<string>(companies[0]?.id ?? '')

  const selectCompany = (id: string) => setSelectedId(id)

  const addCompany = (company: Company) => {
    setCompanies((prev) => [...prev, company])
    setSelectedId(company.id)
  }

  const selected = companies.find((c) => c.id === selectedId)

  return (
    <CompanyContext.Provider value={{ companies, selected, selectCompany, addCompany }}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext)
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider')
  return ctx
}
