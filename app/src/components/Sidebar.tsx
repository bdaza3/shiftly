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
import { useEffect, useState } from 'react'
import { useTranslations } from "next-intl";

export function Sidebar() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { selected } = useCompany();
  const t = useTranslations("nav")
  const common = useTranslations("common")
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false)
  const inferredMembershipRole = selected?.current_user_role ?? null
  const inferredIsAdmin = /manager|admin|owner|company/.test(String(inferredMembershipRole || '').toLowerCase())

  useEffect(() => {
    setMounted(true)
  }, [])

  const firstName = profile?.first_name ?? user?.user_metadata?.firstName ?? '';
  const lastName = profile?.last_name ?? user?.user_metadata?.lastName ?? '';
  const displayName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : user?.user_metadata?.full_name || user?.email);
  // avoid showing raw auth role like 'authenticated' to users
  const rawRole = inferredMembershipRole ?? profile?.role ?? user?.user_metadata?.role ?? user?.role
  let displayRole = rawRole && String(rawRole).toLowerCase() === 'authenticated' ? null : rawRole
  displayRole = displayRole && displayRole.at(0)?.toString().toUpperCase() + displayRole.slice(1) // capitalize first letter for nicer display

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-2S00 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <img src="/images/logo.png" alt="Shiftly Logo" className="w-13 h-13 inline-block mr-1" />
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-gray-900">Shiftly</span>
          <p className="text-xs text-gray-500">{t('tagline')}</p>
        </div>
      </div>
      {/* Temporarily hiding company selector until we have a better design for it
      <div>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 border rounded px-3 py-1 text-sm bg-white hover:bg-gray-50 hover:cursor-pointer"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <span>
              {mounted ? (selected?.name ?? t('selectCompany')) : t('selectCompany')}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      */}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/dashboard" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            {t('dashboard')}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/schedule" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('schedule')}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/team" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('team')}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/requests" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('requests')}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/company" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            {t('company')}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>

        {inferredIsAdmin && (
          <>
            <span className="text-xs font-semibold text-gray-400 uppercase px-4 mt-6 mb-2">{t('management')}</span>
            <Link href="/manageemployees" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {t('manageEmployees')}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link href="/manageshifts" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <span className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                {t('manageShifts')}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link href="/reports" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {t('reports')}
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
                <div className="text-sm font-medium text-gray-800">{displayName ?? common('guest')}</div>
                <div className="text-xs text-gray-500">{displayRole ?? common('employee')}</div>
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
