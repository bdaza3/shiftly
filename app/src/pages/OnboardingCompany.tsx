"use client";

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../../../lib/supabaseClient'
import { useCompany } from '../contexts/CompanyContext'

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function OnboardingCompany() {
  const { user } = useAuth()
  const router = useRouter()
  const { addCompany, refresh } = useCompany()

  // role selection: 'employee' or 'manager'
  const [role, setRole] = useState<'employee'|'manager'|null>(null)
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [companyName, setCompanyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!companyName?.trim()) return alert('Please enter a company name')
    setLoading(true)
    try {
      let created: any = null
      for (let i = 0; i < 5; i++) {
        const code = generateJoinCode()
        const resp = await fetch('/api/companies/create', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: companyName.trim(), join_code: code, user_id: user?.id })
        })
        const json = await resp.json()
        if (!resp.ok) {
          const msg = (json?.error || '').toString().toLowerCase()
          if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) continue
          throw new Error(json?.error || 'failed creating company')
        }
        created = json.company
        break
      }
      if (!created) throw new Error('Could not create company, try again')

      // update client state
      addCompany(created)
      router.push('/dashboard')
    } catch (err: any) {
      alert(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!joinCode?.trim()) return alert('Enter join code')
    setLoading(true)
    try {
      const code = joinCode.trim().toUpperCase()
      const { data: companies } = await supabase.from('companies').select('*').eq('join_code', code).limit(1)
      const company = companies && companies[0]
      if (!company) {
        alert('Company not found for that join code')
        setLoading(false)
        return
      }

      // check membership exists
      const { data: existing } = await supabase.from('company_members').select('*').eq('company_id', company.id).eq('user_id', user?.id).limit(1)
      if (existing && existing.length > 0) {
        // already a member
        addCompany(company)
        router.push('/dashboard')
        return
      }

      // insert membership as employee
      await supabase.from('company_members').insert({ company_id: company.id, user_id: user?.id, role: 'employee' })

      // make company active in client state
      addCompany(company)
      router.push('/dashboard')
    } catch (err: any) {
      alert(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Create or Join a Company</h1>
      <p className="text-sm text-gray-600 mt-1">Choose whether to create a new company or join with a code.</p>

      {/* ask role first */}
      {!role && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-700">Are you joining as an employee or creating a company as a manager?</p>
          <div className="flex gap-4">
            <button onClick={() => { setRole('employee'); setMode('join') }} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded">I'm an employee (join)</button>
            <button onClick={() => { setRole('manager'); setMode('create') }} className="flex-1 px-4 py-3 bg-green-600 text-white rounded">I'm a manager (create)</button>
          </div>
        </div>
      )}

      {role === 'manager' && mode === 'create' && (
        <form onSubmit={handleCreate} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button disabled={loading} type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Create</button>
            <button type="button" onClick={() => { setMode('choose'); setRole(null) }} className="px-4 py-2 border rounded">Back</button>
          </div>
        </form>
      )}

      {role === 'employee' && mode === 'join' && (
        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Enter Join Code</label>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Join</button>
            <button type="button" onClick={() => { setMode('choose'); setRole(null) }} className="px-4 py-2 border rounded">Back</button>
          </div>
        </form>
      )}
    </div>
  )
}
