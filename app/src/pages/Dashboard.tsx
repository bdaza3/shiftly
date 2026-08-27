"use client"

import Link from "next/link"
import { useMemo, type ReactNode } from "react"
import { AlertCircle, CalendarDays, CheckCircle2, Clock3, MapPin, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useAuth } from "../hooks/useAuth"
import { useCompany } from "../hooks/useCompany"
import { useCompanyMembers } from "../hooks/useCompanyMembers"
import { useRole } from "../hooks/useRole"
import { useShifts, type Shift } from "../hooks/useShifts"
import useRequests from "../hooks/useRequests"
import { useLocalePreference } from "../i18n/LocaleProvider"

type Member = { id?: string; user_id?: string; name?: string; email?: string; avatarUrl?: string }

function dateKey(date: Date) { return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-") }
function minutes(value?: string) { const [hours, mins] = String(value ?? "").split(":").map(Number); return Number.isFinite(hours) && Number.isFinite(mins) ? hours * 60 + mins : Number.MAX_SAFE_INTEGER }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?" }

function Avatar({ name, src }: { name: string; src?: string }) {
  return src ? <img src={src} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" /> : <span title={name} className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[8px] font-semibold text-blue-700">{initials(name)}</span>
}

function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: "blue" | "green" | "amber" | "violet" }) {
  const tones = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600" }
  return <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{value}</p></div><div className={`rounded-lg p-3 ${tones[tone]}`}>{icon}</div></div><p className="mt-3 text-xs text-gray-500">{detail}</p></div>
}

export function Dashboard() {
  const t = useTranslations("dashboard")
  const common = useTranslations("common")
  const { locale } = useLocalePreference()
  const { user, profile, userloading } = useAuth()
  const { selected, loading: companiesLoading } = useCompany()
  const { role, loading: roleLoading } = useRole()
  const { members, loading: membersLoading } = useCompanyMembers(selected?.id ?? null)
  const { shifts, loading: shiftsLoading } = useShifts(selected?.id)
  const { requests, loading: requestsLoading } = useRequests()
  const today = useMemo(() => new Date(), [])
  const todayKey = dateKey(today)
  const isManager = ["admin", "manager", "owner"].includes((role ?? selected?.current_user_role ?? "").toLowerCase())
  const userName = `${profile?.first_name ?? user?.user_metadata?.firstName ?? ""} ${profile?.last_name ?? user?.user_metadata?.lastName ?? ""}`.trim() || user?.user_metadata?.full_name || user?.email || common("employee")
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>()
    members.forEach((member: Member) => { const id = member.id ?? member.user_id; if (id) map.set(id, member) })
    if (user?.id) map.set(user.id, { id: user.id, name: userName })
    return map
  }, [members, user?.id, userName])
  const data = useMemo(() => {
    const end = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6))
    const ordered = [...shifts].sort((a, b) => a.date.localeCompare(b.date) || minutes(a.startTime) - minutes(b.startTime))
    const todayShifts = ordered.filter((shift) => shift.date === todayKey)
    const upcoming = ordered.filter((shift) => shift.date >= todayKey && shift.date <= end).slice(0, 8)
    const unassigned = upcoming.filter((shift) => !(shift.employees?.length || shift.employeeId))
    const pending = requests.filter((request) => request.status === "pending")
    const covered = todayShifts.filter((shift) => shift.employees?.length || shift.employeeId).length
    return { todayShifts, upcoming, unassigned, pending, coverage: todayShifts.length ? Math.round((covered / todayShifts.length) * 100) : 100, assigned: todayShifts.reduce((sum, shift) => sum + (shift.employees?.length ?? (shift.employeeId ? 1 : 0)), 0) }
  }, [requests, shifts, today, todayKey])
  const loading = userloading || companiesLoading || roleLoading || membersLoading || shiftsLoading || requestsLoading
  const formatDate = (value: string, options: Intl.DateTimeFormatOptions) => new Date(`${value}T00:00:00`).toLocaleDateString(locale === "ja" ? "ja-JP" : "en-US", options)

  if (loading || !user) return <div className="p-6 text-sm text-gray-500">{t("loading")}</div>

  return <div className="mx-auto max-w-7xl space-y-6">
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label={t("todaysShifts")} value={String(data.todayShifts.length)} detail={data.todayShifts.length === 1 ? t("oneShiftToday") : t("shiftsScheduledToday")} icon={<CalendarDays className="h-5 w-5" />} tone="blue" /><Metric label={t("todayCoverage")} value={`${data.coverage}%`} detail={data.unassigned.length ? t("openShiftsNext7", { count: data.unassigned.length }) : t("allUpcomingCovered")} icon={<CheckCircle2 className="h-5 w-5" />} tone="green" /><Metric label={t("peopleScheduled")} value={String(data.assigned)} detail={t("assignmentsToday")} icon={<Users className="h-5 w-5" />} tone="violet" /><Metric label={t("pendingRequests")} value={String(data.pending.length)} detail={isManager ? t("awaitingDecision") : t("yourRequestsAwaiting")} icon={<AlertCircle className="h-5 w-5" />} tone="amber" /></section>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3"><section className="rounded-xl border border-gray-200 bg-white shadow-sm xl:col-span-2"><PanelHeader title={t("todaysSchedule")} detail={t("allAssigneesShown")} link={t("openSchedule")} />{data.todayShifts.length ? <div className="divide-y divide-gray-100">{data.todayShifts.map((shift) => <ShiftRow key={shift.id} shift={shift} members={memberMap} />)}</div> : <Empty text={t("noShiftsToday")} action={t("planDay")} />}</section><aside className="rounded-xl border border-gray-200 bg-white shadow-sm"><PanelHeader title={t("needsAttention")} detail={t("coverageImpact")} />{data.unassigned.length || (isManager && data.pending.length) ? <div className="space-y-3 p-4">{data.unassigned.slice(0, 3).map((shift) => <Link key={shift.id} href="/schedule" className="block rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><AlertCircle className="mr-2 inline h-4 w-4 text-amber-600" />{t("unassignedShift")}<p className="mt-1 text-xs text-amber-800">{formatDate(shift.date, { month: "short", day: "numeric" })} · {shift.startTime}–{shift.endTime}</p></Link>)}{isManager && data.pending.slice(0, 3).map((request) => <Link key={request.id} href="/requests" className="block rounded-lg bg-violet-50 p-3 text-sm text-violet-950">{t("submittedRequest", { name: request.employeeName ?? common("employee") })}<p className="mt-1 text-xs text-violet-700">{request.type === "time-off" ? t("timeOff") : t("shiftSwap")}</p></Link>)}</div> : <div className="p-8 text-center"><CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-2 text-sm font-medium">{t("everythingCovered")}</p><p className="mt-1 text-xs text-gray-500">{t("nothingNeedsAction")}</p></div>}</aside></div>
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm"><PanelHeader title={t("next7Days")} detail={t("upcomingDescription")} link={t("fullCalendar")} />{data.upcoming.length ? <div className="grid divide-y divide-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">{data.upcoming.map((shift) => <ShiftRow key={shift.id} shift={shift} members={memberMap} />)}</div> : <Empty text={t("noUpcomingShifts")} />}</section>
  </div>
}

function PanelHeader({ title, detail, link }: { title: string; detail: string; link?: string }) { return <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5"><div><h2 className="font-semibold text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{detail}</p></div>{link && <Link href="/schedule" className="shrink-0 text-sm font-semibold text-blue-600">{link}</Link>}</div> }
function Empty({ text, action }: { text: string; action?: string }) { return <div className="p-10 text-center text-sm text-gray-500"><p>{text}</p>{action && <Link href="/schedule" className="mt-2 inline-block font-semibold text-blue-600">{action}</Link>}</div> }
function ShiftRow({ shift, members }: { shift: Shift; members: Map<string, Member> }) { const t = useTranslations("dashboard"); const common = useTranslations("common"); const ids = shift.employees?.length ? shift.employees : shift.employeeId ? [shift.employeeId] : []; return <div className="flex gap-4 p-5"><div className="min-w-14 text-right text-sm"><p className="font-semibold">{shift.startTime ?? "—"}</p><p className="text-gray-500">{shift.endTime ?? "—"}</p></div><div className="h-10 w-1 rounded-full bg-blue-500" /><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900">{shift.role ?? t("scheduledShift")}</p>{shift.location && <p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{shift.location}</p>}<div className="mt-3 flex flex-wrap gap-2">{ids.length ? ids.map((id) => { const member = members.get(id); const name = member?.name ?? member?.email ?? id; return <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 py-1 pl-1 pr-2 text-xs"><Avatar name={name} src={member?.avatarUrl} />{name}</span> }) : <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">{common("unassigned")}</span>}</div></div></div> }
