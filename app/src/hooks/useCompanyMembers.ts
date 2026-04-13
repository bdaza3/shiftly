import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { useCompany } from './useCompany'
import { authFetch } from '@/lib/authFetch'

export function useCompanyMembers(companyId: string | null) {
  const { user } = useAuth()
  const [members, setMembers] = useState<any[]>([])
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

        const resp = await authFetch('/api/company_members/list', {
          method: 'POST',
          body: JSON.stringify({ company_id: targetId }),
          cache: 'no-store',
        })
        const json = await resp.json()
        console.log('Team: company_members API response', { status: resp.status, json })

        if (!resp.ok) throw new Error(json?.error || 'Failed to load company members')

        const out = (json?.members || [])
          .map((member: any) => ({
            ...member,
            user_id: member.user_id ?? member.id,
            full_name: member.full_name ?? member.name ?? null,
            name: member.name ?? member.email ?? member.id,
            role: (member.role || 'employee').charAt(0).toUpperCase() + (member.role || 'employee').slice(1),
          }))
          .filter((member: any) => member.id !== user?.id)

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
