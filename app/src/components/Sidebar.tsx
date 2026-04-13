"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  ClipboardList,
  BarChart3,
  ChevronRight,
  Building
} from "lucide-react";
import CompanySelector from "./CompanySelector";
import { useAuth } from "../hooks/useAuth";
import { useCompany } from "../hooks/useCompany";
import { supabase } from '../../../lib/supabaseClient'
import { startTransition, useEffect, useState } from 'react'
import { authFetch } from "@/lib/authFetch";

export function Sidebar() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { selected } = useCompany();
  const [isAdmin, setIsAdmin] = useState(false);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false)
  const inferredMembershipRole = membershipRole ?? selected?.current_user_role ?? null
  const inferredIsAdmin = /manager|admin|owner|company/.test(String(inferredMembershipRole || '').toLowerCase())

  useEffect(() => {
    setMounted(true)
  }, [])

  
  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!selected?.id || !user?.id) {
        if (mounted) {
          setMembershipRole(selected?.current_user_role ?? null)
          setIsAdmin(/manager|admin|owner|company/.test(String(selected?.current_user_role || '').toLowerCase()))
        }
        return
      }
      try {
        const { data } = await supabase.from('company_members').select('role').eq('company_id', selected.id).eq('user_id', user.id).limit(1)
        let role = data && data[0] && data[0].role
        // if client-side read returns no role (common with RLS until server sync), fallback to server API
        if (!role) {
          try {
            const resp = await authFetch('/api/company_members/get', { method: 'POST', body: JSON.stringify({ company_id: selected.id, user_id: user.id }) })
            if (resp.ok) {
              const json = await resp.json()
              role = json?.membership?.role
            }
          } catch (e) {
            // ignore fallback error; will treat as no role
          }
        }
        if (mounted) {
          console.log('Sidebar: fetched membership role (client)', { role, companyId: selected.id, userId: user.id })
          setMembershipRole(role ?? null)
          const normalized = String(role || '').toLowerCase()
          const adminMatch = /manager|admin|owner|company/.test(normalized)
          setIsAdmin(adminMatch)
          console.log('Sidebar: isAdmin set ->', adminMatch)
        }
      } catch (e) {
        // fallback to server-side lookup when client read is blocked
        try {
          const resp = await authFetch('/api/company_members/get', { method: 'POST', body: JSON.stringify({ company_id: selected?.id, user_id: user?.id }) })
          if (resp.ok) {
            const json = await resp.json()
            const role = json?.membership?.role
            if (mounted) {
              console.log('Sidebar: fetched membership role (server fallback)', { role, companyId: selected?.id, userId: user?.id })
              setMembershipRole(role ?? null)
              const normalized = String(role || '').toLowerCase()
              const adminMatch = /manager|admin|owner|company/.test(normalized)
              setIsAdmin(adminMatch)
              console.log('Sidebar: isAdmin set (fallback) ->', adminMatch)
            }
          } else {
            if (mounted) setIsAdmin(false)
          }
        } catch (e2) {
          if (mounted) setIsAdmin(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [selected?.id, user?.id])
  const firstName = profile?.first_name ?? user?.user_metadata?.firstName ?? '';
  const lastName = profile?.last_name ?? user?.user_metadata?.lastName ?? '';
  const displayName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : user?.user_metadata?.full_name || user?.email);
  // avoid showing raw auth role like 'authenticated' to users
  const rawRole = inferredMembershipRole ?? profile?.role ?? user?.user_metadata?.role ?? user?.role
  let displayRole = rawRole && String(rawRole).toLowerCase() === 'authenticated' ? null : rawRole
  displayRole = displayRole && displayRole.at(0)?.toString().toUpperCase() + displayRole.slice(1) // capitalize first letter for nicer display

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Shiftly</h1>
          <p className="text-sm text-gray-500 mt-1">Shift Management</p>
        </div>
        <div>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 border rounded px-3 py-1 text-sm bg-white hover:bg-gray-50 hover:cursor-pointer"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <span>
              {mounted ? (selected?.name ?? "Select company") : "Select company"}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/dashboard" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/schedule" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/team" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/requests" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Requests
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/company" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Company
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {(isAdmin || inferredIsAdmin) && (
          <>
            <span className="text-xs font-semibold text-gray-400 uppercase px-4 mt-6 mb-2">Management</span>
            <Link href="/manageemployees" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Manage Employees
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link href="/manageshifts" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Manage Shifts
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link href="/analytics" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>
          </>
        )}

      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
                {(displayName?.charAt(0) ?? user?.email?.charAt(0) ?? "U").toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{displayName ?? "Guest"}</div>
                <div className="text-xs text-gray-500">{displayRole ?? 'Employee'}</div>
              </div>
            </div>
          </Link>


          <div className="ml-2" />
        </div>
      </div>

      <CompanySelector open={menuOpen} onClose={() => setMenuOpen(false)} />

      
    </aside>
  );
}
