"use client";

import { Clock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCompany } from "../hooks/useCompany";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useShifts } from "../hooks/useShifts";
import useRequests from "../hooks/useRequests";
import { useRole } from "../hooks/useRole";
import { useCompanyMembers } from "../hooks/useCompanyMembers";
import { useTranslations } from "next-intl";
import { useLocalePreference } from "../i18n/LocaleProvider";

export function Dashboard() {
  const { user, userloading } = useAuth();
  const t = useTranslations("dashboard")
  const common = useTranslations("common")
  const { locale } = useLocalePreference()
  const { companies, selected, loading: companiesLoading } = useCompany();
  const router = useRouter();
  const [ready, setReady] = useState(false)
  const { role: membershipRole, isAdmin, loading: roleLoading } = useRole()
  const effectiveMembershipRole = membershipRole ?? selected?.current_user_role ?? null
  const { members: companyMembers, loading: membersLoading } = useCompanyMembers(selected?.id ?? null)

  useEffect(() => {//if user is signed in but has no companies, send to company onboarding (case where user goes directly to dashboard)
    if (ready && !userloading && !user) {
      router.replace('/')
      return
    }
    if (ready && !userloading && user?.id && !companiesLoading && Array.isArray(companies) && companies.length === 0) {
      router.replace('/register?step=2&sub=create-company')
    }
  }, [user?.id, userloading, user, companies?.length, companiesLoading, ready, router]);

  useEffect(() => { setReady(true) }, [])

  // role is now fetched via useRole()
  const { shifts = [], loading } = useShifts(selected?.id);

  const today = new Date();
  const todayDateStr = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
    .join("-");

  // Compute derived lists from DB-backed shifts
  const todayShifts = (loading ? [] : shifts).filter((s: any) => s.date === todayDateStr);
  const myShifts = effectiveMembershipRole === "employee" ? (shifts || []).filter((s: any) => Array.isArray(s.employees) && s.employees.includes(user.id)) : [];
  const upcomingShift = myShifts.find((s) => new Date(s.date) >= new Date());
  
  //get pending requests for manager/admin view from database (filtering for pending status and future dates)
  //const pendingRequests = sampleRequests.filter((r) => r.status === "pending");

  const { requests: allRequests, loading: requestsLoading, fetchRequests } = useRequests();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    // refresh when selected company changes
    fetchRequests().catch(() => {})
  }, [selected?.id]);

  useEffect(() => {
    const pending = (allRequests || []).filter((r: any) => (r.status === 'pending'))
    setPendingRequests(pending)
  }, [allRequests])

  return (
    userloading || (!user && !ready) ? <div className="p-6">{common('loading')}</div> :
    !user ? <div className="p-6">{common('loading')}</div> :
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{isAdmin ? t('totalEmployees') : t('todaysShifts')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {isAdmin ? (membersLoading ? 'N/A' : (companyMembers.length + 1)) : todayShifts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-600 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('pendingRequests')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {pendingRequests.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F59E0B] bg-opacity-10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {isAdmin ? t('pendingRequests') : t('myShiftsThisWeek')}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {isAdmin ? (requestsLoading ? 'N/A' : pendingRequests.length) : myShifts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Shifts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{t('todaysShifts')}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {today.toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="p-6">
          {todayShifts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t('noShiftsToday')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                        {((shift.employeeName ?? (Array.isArray(shift.employees) && shift.employees.length > 0 ? shift.employees[0] : "N/A"))||"N/A").charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{shift.employeeName ?? (Array.isArray(shift.employees) && shift.employees.length > 0 ? shift.employees[0] : "N/A")}</p>
                        <p className="text-sm text-gray-500">{shift.role}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {shift.status ?? "scheduled"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    {shift.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{shift.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
      {effectiveMembershipRole === "employee" && upcomingShift && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 shadow-sm text-white">
          <h3 className="text-lg font-semibold mb-2">{t('yourNextShift')}</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90">
                {new Date(upcomingShift.date).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-2xl font-bold mt-1">
                {upcomingShift.startTime} - {upcomingShift.endTime}
              </p>
              <p className="text-white/80 mt-1">
                {upcomingShift.role} • {upcomingShift.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notifications */}
      {(effectiveMembershipRole === "manager" || effectiveMembershipRole === "admin") && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {t('pendingApprovals')}
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {pendingRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {request.employeeName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.type === "time-off" ? "Time Off" : "Shift Swap"} •{" "}
                      {new Date(request.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors hover:cursor-pointer ">
                    {common('approve')}
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors hover:cursor-pointer">
                    {common('reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
  );
}
