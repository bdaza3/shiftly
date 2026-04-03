import { useEffect, useState } from 'react'
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';

export function useCompanyMembers(companyId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { selected } = useCompany();
  const targetId = companyId ?? selected?.id ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('Team: effect run, selected=', selected, 'companyId param=', companyId, 'targetId=', targetId)
      if (!targetId) {
        if (mounted) {
          setMembers([]);
          setLoading(false);
          console.log("Team: no target company selected — set members=[] and loading=false");
        }
        return
      }

      try {
        console.log('Team: loading members for company', targetId)
        setLoading(true)
        console.log("Team: loading true — querying company_members")

        const { data: membersData, error: membersError } = await supabase
          .from('company_members')
          .select('user_id, role')
          .eq('company_id', targetId)

        console.log('Team: company_members response', { membersData, membersError })
        if (membersError) throw membersError
        const rows = membersData || []

        const userIds = rows.map((m: any) => m.user_id).filter(Boolean)
        if (userIds.length === 0) {
          if (mounted) setMembers([])
          console.log('Team: no other members found for company', targetId)
          return
        }

        console.log('Team: fetching profiles for userIds', userIds)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds)

        console.log('Team: profiles response', { profilesData, profilesError })
        if (profilesError) throw profilesError

        const profileMap = new Map((profilesData || []).map((p: any) => [p.id, p]))

        const out = rows.map((m: any) => {
          const p = profileMap.get(m.user_id)
          const fullName = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() : null
          return {
            id: m.user_id,
            user_id: m.user_id,
            full_name: fullName,
            name: fullName || m.user_id,
            role: (m.role || 'employee').charAt(0).toUpperCase() + (m.role || 'employee').slice(1),
          }
        }).filter((m: any) => m.user_id !== user?.id)

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
    })();

    return () => { mounted = false; };
  }, [companyId, selected?.id, user?.id, targetId]);

  return { members, loading };
}

export default useCompanyMembers;