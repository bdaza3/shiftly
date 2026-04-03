import { useEffect, useState } from 'react'
import { supabase } from "../../../lib/supabaseClient";
import { useAuth } from './useAuth';
import { useCompany } from './useCompany';

export function useCompanyMembers(companyId: string | null) {
    const { user } = useAuth();
      const [members, setMembers] = useState<any[]>([]);
      const [loading, setLoading] = useState(true);
    
      const { selected } = useCompany();
    
      useEffect(() => {
        let mounted = true;
        (async () => {
          console.log('Team: effect run, selected=', selected)
          if (!selected) {//only runs when no company selected 
            if (mounted) {
              setMembers([]);
              setLoading(false);
              console.log("Loading false (no company selected), members set to empty []");
            }
            return
          }
          try {// first try the simpler query to company_members with profile join, if that fails (e.g. due to RLS) then fall back to fetching members and then profiles separately
            console.log('Team: loading members for company', selected.id)
            setLoading(true)
            console.log("Loading true")
    
            // 1. Get members
            const { data: membersData, error } = await supabase
              .from('company_members')
              .select('user_id, role')
              .eq('company_id', selected.id)
            console.log("Retrieved membersData", membersData, "error", error)
            if (error) throw error
    
            // 2. Get all profiles in ONE query
            const userIds = membersData.map(m => m.user_id)
    
            console.log("Fetching profiles for userIds", userIds)
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .in('id', userIds)
    
            // 3. Map profiles
            console.log(" Retrieved profilesData", profilesData)
            const profileMap = new Map(
              (profilesData || []).map(p => [p.id, p])
            )
    
            // 4. Merge
            const out = membersData.map(m => {
              const p = profileMap.get(m.user_id)
    
              const fullName = p
                ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
                : null
    
              return {
                id: m.user_id,
                user_id: m.user_id,
                full_name: fullName,
                name: fullName || m.user_id,
                role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
              }
            }).filter(m => m.user_id !== user?.id) //filter out current user from team list
    
            setMembers(out)
            console.log('Team: loaded and set members', out)
          } catch (err) {
            console.warn('Team: could not load company members', err)
            if (mounted) setMembers([])
          } finally {
            if (mounted) setLoading(false)
          }
        })();
        return () => { mounted = false; };
      }, [selected?.id]);
      //returns members and loading state; members is an array of { id, user_id, full_name, name, role } for each member of the company except the current user
        return { members, loading };
}

export default useCompanyMembers;