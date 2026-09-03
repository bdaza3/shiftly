import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCompany } from './useCompany'
import { authFetch } from '@/lib/authFetch'

type CompanyMember = {
  id: string
  user_id?: string
  full_name?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
  startDate?: string | null
  avatarUrl?: string | null
}

const membersInFlight = new Map<string, Promise<CompanyMember[]>>()

function loadMembers(companyId: string) {
  const existing = membersInFlight.get(companyId)
  if (existing) return existing

  const request = (async () => {
    const resp = await authFetch('/api/company_members/list', {
      method: 'POST',
      body: JSON.stringify({ company_id: companyId }),
      cache: 'no-store',
    })
    const json = await resp.json()
    if (!resp.ok) throw new Error(json?.error || 'Failed to load company members')
    return json?.members || []
  })()

  membersInFlight.set(companyId, request)
  request.finally(() => membersInFlight.delete(companyId)).catch(() => {})
  return request
}

export function useCompanyMembers(companyId: string | null) {
  const { user } = useAuth()
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [loading, setLoading] = useState(true)

  const { selected } = useCompany()
  const selectedId = selected?.id ?? null
  const targetId = companyId ?? selectedId ?? null

  useEffect(() => {
    let mounted = true

    ;(async () => {
      console.log('Team: effect run, selectedId=', selectedId, 'companyId param=', companyId, 'targetId=', targetId)

      if (!targetId) {
        if (mounted) {
          setMembers([])
          setLoading(false)
          console.log('Team: no target company selected - set members=[] and loading=false')
        }
        return
      }

      try {
        setLoading(true)
        console.log('Team: loading members for company via API', targetId)
        const out = (await loadMembers(targetId))
          .map((member: CompanyMember) => ({
            ...member,
            user_id: member.user_id ?? member.id,
            full_name: member.full_name ?? member.name ?? null,
            name: member.name ?? member.email ?? member.id,
            role: (member.role || 'employee').charAt(0).toUpperCase() + (member.role || 'employee').slice(1),
          }))
          .filter((member: CompanyMember) => member.id !== user?.id)

        if (mounted) {
          setMembers(out)
          console.log('Team: loaded and set members', out)
        }
      } catch (err) {
        console.warn('Team: could not load company members', err)
        if (mounted) setMembers([])
      } finally {
        if (mounted) setLoading(false)
        console.log('Team: loading false (finished)')
      }
    })()

    return () => {
      mounted = false
    }
  }, [companyId, selectedId, user?.id, targetId])

  return { members, loading }
}

export default useCompanyMembers
