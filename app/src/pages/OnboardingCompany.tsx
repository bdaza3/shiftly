"use client";

import React, { startTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../../../lib/supabaseClient'
import { useCompany } from '../hooks/useCompany'

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function OnboardingCompany() {
  const { user, userloading, refreshProfile } = useAuth()
  const router = useRouter()
  const { addCompany, refresh } = useCompany()

  // role selection: 'employee' or 'manager'
  const [role, setRole] = useState<'employee'|'manager'|null>(null)
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [companyName, setCompanyName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!companyName?.trim()) return alert('Please enter a company name')
    setLoading(true)
    try {
      console.log('OnboardingCompany.handleCreate: start', { companyName, userId: user?.id })
      if (!user?.id) {
        setLoading(false)
        alert('User not loaded yet. Please wait a moment and try again.')
        return
      }
      let created: any = null
      for (let i = 0; i < 5; i++) {
        const code = generateJoinCode()
        console.log('OnboardingCompany.handleCreate: trying code', code)
        const resp = await fetch('/api/companies/create', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: companyName.trim(), join_code: code, user_id: user?.id })
        })
        const json = await resp.json()
        console.log('OnboardingCompany.handleCreate: create response', resp.status, json)
        if (!resp.ok) {
          const msg = (json?.error || '').toString().toLowerCase()
          if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) continue
          throw new Error(json?.error || 'failed creating company')
        }
        created = json.company
        console.log('OnboardingCompany.handleCreate: created', created)
        break
      }
      if (!created) throw new Error('Could not create company, try again')

      // refresh profile so UI reflects manager role set by server
      // do not await — a stalled refreshProfile should not block navigation
      try { refreshProfile().then(() => console.log('OnboardingCompany.handleCreate: refreshProfile done')).catch((e: any) => console.warn('refreshProfile failed', e)) } catch (e) { console.warn('refreshProfile (sync) failed', e) }
      // update client state from the created company we already have
      console.log('OnboardingCompany.handleCreate: addCompany', created)
      addCompany(created)
      // ensure server and client are synced
      try { await refresh(); console.log('OnboardingCompany.handleCreate: refresh done') } catch (e) { console.warn('OnboardingCompany.handleCreate: refresh failed', e) }
      console.log('OnboardingCompany.handleCreate: navigating to /dashboard')
      startTransition(() => {
        router.replace('/dashboard')
        router.refresh()
      })
    } catch (err: any) {
      const text = err?.message || String(err)
      setMessage(text)
      alert(text)
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
      console.log('OnboardingCompany.handleJoin: start', { code, userId: user?.id })
      if (!user?.id) {
        setLoading(false)
        alert('User not loaded yet. Please wait a moment and try again.')
        return
      }
      // prefer server-side join to avoid RLS issues
      try {
        if (!user?.id) {
          // try refreshing auth/profile
          await refreshProfile()
        }
        const resp = await fetch('/api/companies/join', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ join_code: code, user_id: user?.id }) })
        const json = await resp.json()
        console.log('OnboardingCompany.handleJoin: join response', resp.status, json)
        if (!resp.ok) {
          throw new Error(json?.error || 'failed to join company')
        }
        const company = json.company
        console.log('OnboardingCompany.handleJoin: joined company', company)
        // update client state from the returned company
        addCompany(company)
        // ensure server and client are synced
        try { await refresh(); console.log('OnboardingCompany.handleJoin: refresh done') } catch (e) { console.warn('OnboardingCompany.handleJoin: refresh failed', e) }
        console.log('OnboardingCompany.handleJoin: navigating to /dashboard')
        startTransition(() => {
          router.replace('/dashboard')
          router.refresh()
        })
        return
      } catch (serverJoinErr) {
        // fallback to client-side join
        console.warn('OnboardingCompany.handleJoin: server join failed, falling back', serverJoinErr)
      }

      // fallback: client-side lookup/insert
      const { data: companies } = await supabase.from('companies').select('*').eq('join_code', code).limit(1)
      const company = companies && companies[0]
      if (!company) {
        alert('Company not found for that join code')
        setLoading(false)
        return
      }
      const { data: existing } = await supabase.from('company_members').select('*').eq('company_id', company.id).eq('user_id', user?.id).limit(1)
      if (existing && existing.length > 0) {
        addCompany(company)
        try { await refresh(); console.log('OnboardingCompany.handleJoin: refresh done (existing)') } catch (e) { console.warn('OnboardingCompany.handleJoin: refresh failed', e) }
        startTransition(() => {
          router.replace('/dashboard')
          router.refresh()
        })
        return
      }
      await supabase.from('company_members').insert({ company_id: company.id, user_id: user?.id, role: 'employee' })
      addCompany(company)
      try { await refresh(); console.log('OnboardingCompany.handleJoin: refresh done (fallback)') } catch (e) { console.warn('OnboardingCompany.handleJoin: refresh failed', e) }
      startTransition(() => {
        router.replace('/dashboard')
        router.refresh()
      })
    } catch (err: any) {
      const text = err?.message || String(err)
      setMessage(text)
      alert(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    userloading ? <div className="p-6">Loading...</div> :
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Create or Join a Company</h1>
      <p className="text-sm text-gray-600 mt-1">Choose whether to create a new company or join with a code.</p>

      {/* ask role first */}
      {!role && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-700">Are you joining as an employee or creating a company as a manager?</p>
          <div className="flex gap-4">
            <button onClick={() => { setRole('employee'); setMode('join') }} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer">I'm an employee (join)</button>
            <button onClick={() => { setRole('manager'); setMode('create') }} className="flex-1 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 hover:cursor-pointer">I'm a manager (create)</button>
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
            <button disabled={loading} type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 hover:cursor-pointer">Create</button>
            <button type="button" onClick={() => { setMode('choose'); setRole(null) }} className="px-4 py-2 border rounded hover:bg-gray-100 hover:cursor-pointer">Back</button>
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
      {message && <div className="mt-2 text-sm text-red-600">{message}</div>}
    </div>
  )
}
