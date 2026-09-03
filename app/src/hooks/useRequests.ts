"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "./useAuth"
import { useCompany } from "./useCompany"
import { authFetch } from "@/lib/authFetch"

export type RequestRecord = {
  id: string
  requester_id?: string
  employee_name?: string
  employeeName?: string
  reason?: string
  type: string
  date: string
  details?: string
  status: string
  created_at?: string
  createdAt?: string
  company_id?: string
}

const requestsInFlight = new Map<string, Promise<RequestRecord[]>>()

function loadRequests(companyId: string) {
  const existing = requestsInFlight.get(companyId)
  if (existing) return existing

  const request = (async () => {
    const resp = await authFetch('/api/requests/list', { method: 'POST', body: JSON.stringify({ company_id: companyId }), cache: 'no-store' })
    const json = await resp.json()
    if (!resp.ok) throw new Error(json?.error || 'Failed to load requests')
    return json.requests || []
  })()

  requestsInFlight.set(companyId, request)
  request.finally(() => requestsInFlight.delete(companyId)).catch(() => {})
  return request
}

export function useRequests() {
  const { user } = useAuth()
  const { selected } = useCompany()
  const [requests, setRequests] = useState<RequestRecord[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      if (!selected?.id) {
        setRequests([])
        return
      }
      try {
        const data = await loadRequests(selected.id)
        setRequests((data || []).map((r: RequestRecord) => ({
          ...r,
          createdAt: r.created_at ?? r.createdAt,
          employeeName: r.employee_name ?? r.employeeName ?? null,
          reason: r.details ?? r.reason ?? null,
          date: r.date ? (typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0]) : ''
        })))
      } catch (error) {
        console.warn('useRequests: server list failed', error)
        setRequests([])
      }
    } catch (e) {
      console.warn('useRequests: unexpected fetch error', e)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [selected?.id])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests, user?.id, selected?.id])

  const createRequest = async (payload: Partial<RequestRecord>) => {
    try {
      const row = {
        requester_id: payload.requester_id ?? user?.id,
        employee_name: payload.employee_name ?? payload.employeeName ?? null,
        type: payload.type,
        date: payload.date,
        details: payload.details ?? payload.reason ?? null,
        status: payload.status ?? 'pending',
        company_id: payload.company_id ?? selected?.id ?? null,
      }
      const resp = await authFetch('/api/requests/create', { method: 'POST', body: JSON.stringify(row) })
      const json = await resp.json()
      if (!resp.ok) {
        console.warn('useRequests.createRequest server failed', json)
        throw new Error(json?.error || 'create failed')
      }
      const data = json.request
      const normalized = {
        ...data,
        createdAt: data.created_at ?? data.createdAt,
        employeeName: data.employee_name ?? data.employeeName ?? null,
        reason: data.details ?? data.reason ?? null,
        date: data.date ? (typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().split('T')[0]) : ''
      }
      setRequests((s) => [normalized, ...s])
      return normalized
    } catch (e) {
      console.warn('useRequests.createRequest failed', e)
      throw e
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const resp = await authFetch('/api/requests/update', { method: 'POST', body: JSON.stringify({ id, status }) })
      const json = await resp.json()
      if (!resp.ok) {
        console.warn('useRequests.updateStatus server failed', json)
        throw new Error(json?.error || 'update failed')
      }
      const data = json.request
      setRequests((s) => s.map((r) => (r.id === id ? { ...r, status: data.status } : r)))
      return data
    } catch (e) {
      console.warn('useRequests.updateStatus failed', e)
      throw e
    }
  }

  return {
    requests,
    loading,
    fetchRequests,
    createRequest,
    updateStatus,
  }
}

export default useRequests
