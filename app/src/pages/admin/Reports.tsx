"use client"

import { useMemo, useState, type ReactNode } from "react"
import { AlertCircle, BarChart3, CalendarDays, CheckCircle2, Clock3 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCompany } from "../../hooks/useCompany"
import { useCompanyMembers } from "../../hooks/useCompanyMembers"
import useRequests from "../../hooks/useRequests"
import { useShifts, type Shift } from "../../hooks/useShifts"

type Range = "week" | "month" | "quarter"

function localDateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
}

function shiftHours(shift: Shift) {
  const toMinutes = (value?: string) => {
    const [hours, minutes] = String(value ?? "").split(":").map(Number)
    return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null
  }
  const start = toMinutes(shift.startTime)
  const end = toMinutes(shift.endTime)
  if (start === null || end === null) return 0
  const duration = end >= start ? end - start : 24 * 60 - start + end
  return duration / 60
}

function periodStart(range: Range) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - (range === "week" ? 6 : range === "month" ? 29 : 89))
  return date
}

export function Reports() {
  const t = useTranslations("reports")
  const common = useTranslations("common")
  const { selected } = useCompany()
  const { members, loading: membersLoading } = useCompanyMembers(selected?.id ?? null)
  const { shifts, loading: shiftsLoading } = useShifts(selected?.id)
  const { requests, loading: requestsLoading } = useRequests()
  const [range, setRange] = useState<Range>("month")

  const data = useMemo(() => {
    const start = periodStart(range)
    const startKey = localDateKey(start)
    const endKey = localDateKey(new Date())
    const rangeShifts = shifts.filter((shift) => shift.date >= startKey && shift.date <= endKey)
    const rangeRequests = requests.filter((request) => {
      const created = request.createdAt ?? request.created_at ?? request.date
      return created ? new Date(created) >= start : false
    })
    const assignedShiftCount = rangeShifts.filter((shift) => (shift.employees?.length ?? 0) > 0 || shift.employeeId).length
    const unassignedCount = rangeShifts.length - assignedShiftCount
    const totalHours = rangeShifts.reduce((sum, shift) => sum + shiftHours(shift) * Math.max(1, shift.employees?.length ?? (shift.employeeId ? 1 : 0)), 0)
    const averageShiftLength = rangeShifts.length ? rangeShifts.reduce((sum, shift) => sum + shiftHours(shift), 0) / rangeShifts.length : 0
    const coverage = rangeShifts.length ? Math.round((assignedShiftCount / rangeShifts.length) * 100) : 0
    const pendingRequests = requests.filter((request) => request.status === "pending").length

    const roleCounts = new Map<string, number>()
    rangeShifts.forEach((shift) => {
      const role = shift.role ? String(shift.role) : t("unlabeled")
      roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)
    })
    const roles = [...roleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    const memberMap = new Map(members.map((member) => [member.id ?? member.user_id, member]))
    const workload = new Map<string, { shifts: number; hours: number }>()
    rangeShifts.forEach((shift) => {
      const employeeIds = shift.employees?.length ? shift.employees : shift.employeeId ? [shift.employeeId] : []
      employeeIds.forEach((id) => {
        const current = workload.get(id) ?? { shifts: 0, hours: 0 }
        current.shifts += 1
        current.hours += shiftHours(shift)
        workload.set(id, current)
      })
    })
    const employeeWorkload = [...workload.entries()]
      .map(([id, stats]) => ({ id, name: memberMap.get(id)?.name ?? memberMap.get(id)?.email ?? id, ...stats }))
      .sort((a, b) => b.hours - a.hours || b.shifts - a.shifts)

    const days = Array.from({ length: range === "week" ? 7 : range === "month" ? 30 : 13 }, (_, index) => {
      const date = new Date()
      if (range === "quarter") date.setDate(date.getDate() - (12 - index) * 7)
      else date.setDate(date.getDate() - ((range === "week" ? 6 : 29) - index))
      const key = localDateKey(date)
      const hours = rangeShifts.filter((shift) => shift.date === key).reduce((sum, shift) => sum + shiftHours(shift) * Math.max(1, shift.employees?.length ?? 0), 0)
      return { key, label: range === "quarter" ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : date.toLocaleDateString(undefined, { weekday: range === "week" ? "short" : undefined, month: range === "month" ? "short" : undefined, day: range === "month" ? "numeric" : undefined }), hours }
    })
    const maxDailyHours = Math.max(...days.map((day) => day.hours), 1)
    return { rangeShifts, rangeRequests, totalHours, averageShiftLength, coverage, unassignedCount, pendingRequests, roles, employeeWorkload, days, maxDailyHours }
  }, [members, range, requests, shifts, t])

  const loading = shiftsLoading || membersLoading || requestsLoading
  const totalRoles = data.rangeShifts.length || 1

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4"><BarChart3 className="h-7 w-7 text-blue-600" /><div><h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2><p className="mt-1 text-sm text-gray-500">{t("description")}</p></div></div>
          <select value={range} onChange={(event) => setRange(event.target.value as Range)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="week">{t("thisWeek")}</option><option value="month">{t("last30Days")}</option><option value="quarter">{t("last90Days")}</option>
          </select>
        </div>
      </div>

      {loading ? <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">{common("loading")}</div> : <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Clock3 className="h-5 w-5" />} label={t("scheduledHours")} value={`${data.totalHours.toFixed(1)}h`} detail={t("staffingHoursDetail")} tone="blue" />
          <Metric icon={<CheckCircle2 className="h-5 w-5" />} label={t("shiftCoverage")} value={`${data.coverage}%`} detail={t("assignedOf", { assigned: data.rangeShifts.length - data.unassignedCount, total: data.rangeShifts.length })} tone="green" />
          <Metric icon={<CalendarDays className="h-5 w-5" />} label={t("averageShift")} value={`${data.averageShiftLength.toFixed(1)}h`} detail={t("fromShifts", { count: data.rangeShifts.length })} tone="purple" />
          <Metric icon={<AlertCircle className="h-5 w-5" />} label={t("pendingRequests")} value={String(data.pendingRequests)} detail={t("requestsInPeriod", { count: data.rangeRequests.length })} tone="amber" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">{t("hoursByDay")}</h3>
            <p className="mt-1 text-sm text-gray-500">{t("hoursByDayDescription")}</p>
            <div className="mt-6 space-y-3">{data.days.map((day) => <div key={day.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-600">{day.label}</span>
                <span className="font-medium text-gray-900">{day.hours.toFixed(1)}h</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${(day.hours / data.maxDailyHours) * 100}%` }} />
              </div>
            </div>)}</div>
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">{t("shiftsByRole")}</h3>
            <p className="mt-1 text-sm text-gray-500">{t("shiftsByRoleDescription")}</p>
            <div className="mt-6 space-y-4">{data.roles.length ? data.roles.map(([role, count]) => <div key={role}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-700">{role}</span>
                <span className="font-medium text-gray-900">{t("shiftCount", { count })}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-violet-500" style={{ width: `${(count / totalRoles) * 100}%` }} />
              </div>
            </div>) : <Empty text={t("noShiftData")} />}</div></section>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">{t("employeeWorkload")}</h3>
            <p className="mt-1 text-sm text-gray-500">{t("employeeWorkloadDescription")}</p>
          </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <HeaderCell>{t("employee")}</HeaderCell>
                    <HeaderCell>{t("assignedShifts")}</HeaderCell>
                    <HeaderCell>{t("scheduledHours")}</HeaderCell>
                    <HeaderCell>{t("shareOfHours")}</HeaderCell>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.employeeWorkload.length ? data.employeeWorkload.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{employee.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{employee.shifts}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{employee.hours.toFixed(1)}h</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{data.totalHours ? Math.round((employee.hours / data.totalHours) * 100) : 0}%</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-10">
                        <Empty text={t("noWorkloadData")} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

        {data.unassignedCount > 0 && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{t("unassignedAlert", { count: data.unassignedCount })}</p>
        </div>}
      </>}
    </div>
  )
}

function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: "blue" | "green" | "purple" | "amber" }) {
  const colors = { blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", purple: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600" }
  return( 
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`rounded-lg p-3 ${colors[tone]}`}>{icon}</div>
    </div>
    <p className="mt-3 text-xs text-gray-500">{detail}</p>
    </div>
  )
}

function HeaderCell({ children }: { children: ReactNode }) { return <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{children}</th> }
function Empty({ text }: { text: string }) { return <p className="py-6 text-center text-sm text-gray-500">{text}</p> }
