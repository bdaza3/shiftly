"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCompany } from "../contexts/CompanyContext";
import { useAuth } from "../contexts/AuthContext";

export function Team() {

  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { selected } = useCompany();

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('Team: effect run, selected=', selected)
      if (!selected) {
        if (mounted) {
          setMembers([]);
          setLoading(false);
        }
        return
      }
      try {// first try the simpler query to company_members with profile join, if that fails (e.g. due to RLS) then fall back to fetching members and then profiles separately
        console.log('Team: loading members for company', selected.id)
        setLoading(true)
        // 1. Get members
        const { data: membersData, error } = await supabase
          .from('company_members')
          .select('user_id, role')
          .eq('company_id', selected.id)
        console.log("membersData", membersData, "error", error)
        if (error) throw error

        // 2. Get all profiles in ONE query
        const userIds = membersData.map(m => m.user_id)

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds)

        // 3. Map profiles
        console.log("profilesData", profilesData)
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
      } catch (err) {
        console.warn('Team: could not load company members', err)
        if (mounted) setMembers([])
      } finally {
        if (mounted) setLoading(false)
      }
    })();
    return () => { mounted = false; };
  }, [selected?.id]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team</h2>
          <p className="text-sm text-gray-500 mt-1">Directory of employees</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500">No team members found.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const fullName =
                m.full_name ||
                (m.first_name || m.last_name ? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() : null) ||
                m.name ||
                m.email ||
                m.id ||
                m.user_id ||
                "Unknown";
              return (
                <div key={m.id ?? fullName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-medium">{(fullName || "?").charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{fullName}</p>
                      <p className="text-sm text-gray-500">{m.role ?? "Employee"}{m.email ? ` • ${m.email}` : ""}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Team;
