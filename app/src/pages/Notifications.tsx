"use client"

import { Bell, CalendarClock, CheckCircle2, ClipboardList, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { authFetch } from "@/lib/authFetch"
import { useCompany } from "../hooks/useCompany"
import { useRole } from "../hooks/useRole"
import useRequests, { type RequestRecord } from "../hooks/useRequests"

type Member = { id: string; name?: string | null; email?: string | null; role?: string | null; startDate?: string | null }
type Activity = { id: string; kind: "member" | "request" | "shift"; timestamp: string; title: string; detail: string }
type ShiftNotification = { id: string; title: string; detail: string; created_at: string }

function relativeTime(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(locale === "ja" ? "ja-JP" : "en-US", { numeric: "auto" })
  if (seconds > -60) return formatter.format(seconds, "second")
  if (seconds > -3600) return formatter.format(Math.round(seconds / 60), "minute")
  if (seconds > -86_400) return formatter.format(Math.round(seconds / 3600), "hour")
  return formatter.format(Math.round(seconds / 86_400), "day")
}

export function Notifications() {
  const t = useTranslations("notifications")
  const requestText = useTranslations("requests")
  const common = useTranslations("common")
  const { selected } = useCompany()
  const { isAdmin } = useRole()
  const { requests, loading: requestsLoading } = useRequests()
  const [members, setMembers] = useState<Member[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [shiftNotifications, setShiftNotifications] = useState<ShiftNotification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  useEffect(() => {
    let active = true
    const loadNotifications = async () => {
      setNotificationsLoading(true)
      try {
        const response = await authFetch("/api/notifications/list", { cache: "no-store" })
        const result = await response.json()
        if (!response.ok) throw new Error(result?.error || "Unable to load notifications")
        if (active) setShiftNotifications(result.notifications ?? [])
      } catch (error) {
        console.warn("Notifications: unable to load shift notifications", error)
        if (active) setShiftNotifications([])
      } finally {
        if (active) setNotificationsLoading(false)
      }
    }
    void loadNotifications()
    return () => { active = false }
  }, [])

  useEffect(() => {//load company members when the selected company changes or when the user role changes
    let active = true
    if (!selected?.id || !isAdmin) {
      setMembers([])
      return
    }
    const loadMembers = async () => {
      setMembersLoading(true)
      try {
        const response = await authFetch("/api/company_members/list", { method: "POST", body: JSON.stringify({ company_id: selected.id }), cache: "no-store" })
        const result = await response.json()
        if (!response.ok) throw new Error(result?.error || "Unable to load members")
        if (active) setMembers(result.members ?? [])
      } catch (error) {
        console.warn("Notifications: unable to load members", error)
        if (active) setMembers([])
      } finally {
        if (active) setMembersLoading(false)
      }
    }
    void loadMembers()
    return () => { active = false }
  }, [isAdmin, selected?.id])

  const activities = useMemo<Activity[]>(() => {//combine requests and members into a single list of activities, sorted by timestamp
    
    const requestActivities = requests.map((request: RequestRecord) => ({//requests
      id: `request-${request.id}`,
      kind: "request" as const,
      timestamp: request.createdAt ?? request.created_at ?? request.date,
      title: requestText("newRequest"),
      detail: `${request.employeeName ?? request.employee_name ?? common("unknown")} · ${request.type === "time-off" ? requestText("timeOff") : requestText("shiftSwap")}`,
    }))
    const memberActivities = members.filter((member) => member.startDate).map((member) => ({//members joining
      id: `member-${member.id}`,
      kind: "member" as const,
      timestamp: member.startDate as string,
      title: t("employeeJoined"),
      detail: `${member.name ?? member.email ?? common("unknown")} · ${member.role ?? common("employee")}`,
    }))
    const shiftActivities = shiftNotifications.map((notification) => ({
      id: `shift-${notification.id}`,
      kind: "shift" as const,
      timestamp: notification.created_at,
      title: notification.title,
      detail: notification.detail,
    }))
    return [...shiftActivities, ...requestActivities, ...memberActivities]
      .filter((activity) => Boolean(activity.timestamp))
      .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
  }, [common, members, requestText, requests, shiftNotifications, t])

  const loading = requestsLoading || membersLoading || notificationsLoading
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center"><Bell className="w-6 h-6 text-blue-600" /></div>
        <div><h1 className="text-2xl font-semibold">{t("title")}</h1><p className="text-sm text-gray-600 mt-1">{t(isAdmin ? "adminDescription" : "employeeDescription")}</p></div>
      </div>
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {loading ? <div className="p-6 text-sm text-gray-500">{common("loading")}</div> : activities.length === 0 ? (
          <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-green-500" /><p className="mt-3 font-medium text-gray-900">{t("allCaughtUp")}</p><p className="mt-1 text-sm text-gray-500">{t("emptyDescription")}</p></div>
        ) : activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-5">
            <div className={`mt-0.5 rounded-full p-2 ${activity.kind === "member" ? "bg-blue-50 text-blue-600" : activity.kind === "shift" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>{activity.kind === "member" ? <Users className="h-4 w-4" /> : activity.kind === "shift" ? <CalendarClock className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}</div>
            <div className="min-w-0 flex-1"><p className="font-medium text-gray-900">{activity.title}</p><p className="mt-1 text-sm text-gray-600 truncate">{activity.detail}</p></div>
            <time dateTime={activity.timestamp} className="shrink-0 text-xs text-gray-500">{relativeTime(activity.timestamp, t("locale"))}</time>
          </div>
        ))}
      </section>
    </div>
  )
}
