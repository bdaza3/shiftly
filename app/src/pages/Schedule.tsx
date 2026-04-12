/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  LoaderCircle,
  Redo2,
  Sparkles,
  Undo2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import CreateShiftModal from "../components/CreateShiftModal";
import GanttDayDetail from "../components/GanttDayDetail";
import { useAuth } from "../hooks/useAuth";
import { useCompany } from "../hooks/useCompany";
import { useRole } from "../hooks/useRole";
import { useShifts } from "../hooks/useShifts";

type SaveState = { kind: "idle" | "saving" | "saved" | "error"; message: string };
type HistoryEntry = { label: string; undo: () => Promise<void>; redo: () => Promise<void> };
type EmployeeOption = { id: string; name: string; role?: string };
type ShiftDraft = {
  date: string;
  startTime: string;
  endTime: string;
  employees: string[];
  employeeId?: string;
  employeeName?: string;
  role: string;
  location?: string;
  company_id?: string;
};

const EMPTY_STATE: SaveState = { kind: "idle", message: "" };

function SaveBadge({ state }: { state: SaveState }) {
  if (state.kind === "idle") return null;
  const tone = state.kind === "saved" ? "bg-emerald-50 text-emerald-700" : state.kind === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${tone}`}>
      {state.kind === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      <span>{state.message}</span>
    </div>
  );
}

export function Schedule() {
  const { user, profile } = useAuth();
  const { selected } = useCompany();
  const { isAdmin } = useRole();
  const { shifts, createShift, updateShift, deleteShift } = useShifts(selected?.id);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [companyMembers, setCompanyMembers] = useState<EmployeeOption[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [shiftMeta, setShiftMeta] = useState<Record<string, { employees?: string[]; employeeName?: string }>>({});
  const [saveState, setSaveState] = useState<SaveState>(EMPTY_STATE);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoHistory, setRedoHistory] = useState<HistoryEntry[]>([]);
  const [copiedShift, setCopiedShift] = useState<ShiftDraft | null>(null);
  const [dragPreview, setDragPreview] = useState<{ visible: boolean; x: number; y: number; title?: string }>({ visible: false, x: 0, y: 0 });
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStatus = useCallback((kind: SaveState["kind"], message: string) => {
    if (resetRef.current) clearTimeout(resetRef.current);
    setSaveState({ kind, message });
    if (kind === "saved" || kind === "error") resetRef.current = setTimeout(() => setSaveState(EMPTY_STATE), 2200);
  }, []);

  useEffect(() => () => { if (resetRef.current) clearTimeout(resetRef.current); }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selected?.id) return mounted && setCompanyMembers([]);
      try {
        const { data: membersData, error } = await supabase.from("company_members").select("user_id, role").eq("company_id", selected.id);
        if (error) throw error;
        const userIds = (membersData || []).map((m: any) => m.user_id).filter(Boolean);
        const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, first_name, last_name").in("id", userIds) : { data: [] };
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()]));
        if (!mounted) return;
        setCompanyMembers((membersData || []).map((m: any) => ({ id: m.user_id, name: profileMap.get(m.user_id) || m.user_id, role: m.role })).filter((m: EmployeeOption) => m.id !== user?.id));
        console.log("Schedule.members loaded", { selectedId: selected?.id, membersCount: (membersData || []).length });
      } catch (error) {
        console.warn("Schedule members load failed", error);
        if (mounted) setCompanyMembers([]);
      }
    })();
    return () => { mounted = false; };
  }, [selected?.id, user?.id]);

  useEffect(() => {
    setShiftMeta((prev) => {
      const next = { ...prev };
      shifts.forEach((shift) => {
        if (!shift.id) return;
        next[shift.id] = { employees: shift.employees ?? prev[shift.id]?.employees, employeeName: shift.employeeName ?? shift.name ?? prev[shift.id]?.employeeName };
      });
      return next;
    });
  }, [shifts]);

  const assignableEmployees = useMemo(() => companyMembers.filter((m) => !["admin", "manager"].includes((m.role || "").toLowerCase()) && m.id !== user?.id), [companyMembers, user?.id]);
  const pushHistory = useCallback((entry: HistoryEntry) => { setHistory((prev) => [...prev, entry]); setRedoHistory([]); }, []);
  const withCompany = useCallback((draft: ShiftDraft) => ({ ...draft, ...(selected?.id ? { company_id: selected.id } : {}) }), [selected?.id]);
  const toDraft = useCallback((shift: any, overrides: Partial<ShiftDraft> = {}): ShiftDraft => {
    const employees = overrides.employees ?? shift.employees ?? [];
    const employeeId = overrides.employeeId ?? shift.employeeId ?? employees[0];
    const employeeName = overrides.employeeName ?? shift.employeeName ?? (employeeId ? companyMembers.find((m) => m.id === employeeId)?.name : undefined);
    return {
      date: overrides.date ?? shift.date,
      startTime: overrides.startTime ?? shift.startTime ?? "09:00",
      endTime: overrides.endTime ?? shift.endTime ?? "17:00",
      employees,
      ...(employeeId ? { employeeId } : {}),
      ...(employeeName ? { employeeName } : {}),
      role: overrides.role ?? shift.role ?? "Staff",
      ...(overrides.location ?? shift.location ? { location: overrides.location ?? shift.location } : {}),
      ...(selected?.id ? { company_id: selected.id } : {}),
    };
  }, [companyMembers, selected?.id]);

  const runAction = useCallback(async (label: string, action: () => Promise<void>) => {
    setStatus("saving", label);
    try {
      await action();
      setStatus("saved", "Saved changes");
    } catch (error) {
      console.error(label, error);
      setStatus("error", "Could not save changes");
      throw error;
    }
  }, [setStatus]);

  const getWeekDates = (date: Date) => {
    const week: Date[] = [];
    const current = new Date(date);
    current.setDate(current.getDate() - current.getDay());
    for (let i = 0; i < 7; i += 1) { week.push(new Date(current)); current.setDate(current.getDate() + 1); }
    return week;
  };

  // parse a YYYY-MM-DD date string into a local Date at midnight
  const parseYMD = (s?: string | null) => {
    if (!s) return null;
    const parts = String(s).split("-").map((x) => parseInt(x, 10));
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  };

  const getShiftsForDate = useCallback((date: Date) => shifts.filter((shift) => {
    const shiftDate = parseYMD(shift.date);
    if (!shiftDate) return false;
    return shiftDate.getDate() === date.getDate() && shiftDate.getMonth() === date.getMonth() && shiftDate.getFullYear() === date.getFullYear();
  }), [shifts]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const handleUndo = useCallback(async () => {
    const entry = history[history.length - 1];
    if (!entry) return;
    setHistory((prev) => prev.slice(0, -1));
    try { await runAction(`Undoing ${entry.label.toLowerCase()}`, entry.undo); setRedoHistory((prev) => [...prev, entry]); }
    catch { setHistory((prev) => [...prev, entry]); }
  }, [history, runAction]);

  const handleRedo = useCallback(async () => {
    const entry = redoHistory[redoHistory.length - 1];
    if (!entry) return;
    setRedoHistory((prev) => prev.slice(0, -1));
    try { await runAction(`Redoing ${entry.label.toLowerCase()}`, entry.redo); setHistory((prev) => [...prev, entry]); }
    catch { setRedoHistory((prev) => [...prev, entry]); }
  }, [redoHistory, runAction]);

  const handleSaveShift = useCallback(async (payload: any) => {
    const draft = withCompany(payload);
    console.log("Schedule.handleSaveShift called", { payload, selectedCompany: selected?.id });
    if (payload.id) {
      const existing = shifts.find((shift) => shift.id === payload.id);
      if (!existing) return;
      const before = toDraft(existing);
      await runAction("Saving shift", async () => { await updateShift(payload.id, draft); });
      console.log("Schedule.saved shift", { id: payload.id });
      pushHistory({ label: "Edit shift", undo: async () => { await updateShift(payload.id, before); }, redo: async () => { await updateShift(payload.id, draft); } });
    } else {
      let createdId = "";
      await runAction("Creating shift", async () => { const created = await createShift(draft); createdId = created.id; });
      console.log("Schedule.created shift", { createdId });
      pushHistory({ label: "Create shift", undo: async () => { await deleteShift(createdId); }, redo: async () => { const recreated = await createShift(draft); createdId = recreated.id; } });
    }
    setEditingShift(null);
    setShowCreateModal(false);
  }, [createShift, deleteShift, pushHistory, runAction, shifts, toDraft, updateShift, withCompany]);

  const handleDeleteShift = useCallback(async (id: string) => {
    console.log("Schedule.handleDeleteShift called", { id });
    const existing = shifts.find((shift) => shift.id === id);
    if (!existing) return;
    const before = toDraft(existing);
    let activeId = id;
    await runAction("Deleting shift", async () => { await deleteShift(id); });
    console.log("Schedule.deleted shift", { id });
    pushHistory({
      label: "Delete shift",
      undo: async () => { const restored = await createShift(before); activeId = restored.id; },
      redo: async () => { await deleteShift(activeId); },
    });
    setEditingShift(null);
    setShowCreateModal(false);
  }, [createShift, deleteShift, pushHistory, runAction, shifts, toDraft]);

  const handleMoveShift = useCallback(async (shiftId: string, newDate: string) => {
    console.log("Schedule.handleMoveShift start", { shiftId, newDate });
    const existing = shifts.find((shift) => shift.id === shiftId);
    if (!existing || existing.date === newDate) return;
    const before = toDraft(existing);
    const after = toDraft(existing, { date: newDate });
    await runAction("Moving shift", async () => { await updateShift(shiftId, after); });
    console.log("Schedule.handleMoveShift done", { shiftId, beforeDate: before.date, afterDate: after.date });
    pushHistory({ label: "Move shift", undo: async () => { await updateShift(shiftId, before); }, redo: async () => { await updateShift(shiftId, after); } });
  }, [pushHistory, runAction, shifts, toDraft, updateShift]);

  const handleCopyShift = useCallback((shift: any) => { setCopiedShift(toDraft(shift)); setStatus("saved", "Shift copied"); }, [setStatus, toDraft]);

  const handlePasteShift = useCallback(async (date: string) => {
    console.log("Schedule.handlePasteShift called", { date, copiedShift });
    if (!copiedShift) return;
    const draft = withCompany({ ...copiedShift, date });
    let createdId = "";
    await runAction("Copying shift", async () => { const created = await createShift(draft); createdId = created.id; });
    console.log("Schedule.pasted shift", { createdId });
    pushHistory({ label: "Copy shift", undo: async () => { await deleteShift(createdId); }, redo: async () => { const recreated = await createShift(draft); createdId = recreated.id; } });
  }, [copiedShift, createShift, deleteShift, pushHistory, runAction, withCompany]);

  const buildAutoShifts = useCallback((date: string) => {
    const busy = new Set(shifts.filter((shift) => shift.date === date).flatMap((shift) => shift.employees ?? []));
    const counts = new Map(assignableEmployees.map((employee) => [employee.id, shifts.reduce((sum, shift) => sum + ((shift.employees ?? []).includes(employee.id) ? 1 : 0), 0)]));
    const available = [...assignableEmployees]
      .filter((employee) => !busy.has(employee.id))
      .sort((left, right) => ((counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0)) || left.name.localeCompare(right.name));
    return [
      { startTime: "07:00", endTime: "15:00", role: "Opening" },
      { startTime: "09:00", endTime: "17:00", role: "Mid" },
      { startTime: "15:00", endTime: "23:00", role: "Closing" },
    ].slice(0, available.length).map((template, index) => withCompany({ date, ...template, employees: [available[index].id], employeeId: available[index].id, employeeName: available[index].name }));
  }, [assignableEmployees, shifts, withCompany]);

  const handleAutoCreate = useCallback(async (date: string) => {
    const drafts = buildAutoShifts(date);
    console.log("Schedule.handleAutoCreate start", { date, draftsCount: drafts.length });
    if (drafts.length === 0) return setStatus("error", "No available employees for auto-fill");
    let createdIds: string[] = [];
    await runAction("Auto-filling shifts", async () => {
      createdIds = [];
      for (const draft of drafts) { const created = await createShift(draft); createdIds.push(created.id); }
    });
    console.log("Schedule.handleAutoCreate created", { date, createdCount: createdIds.length, createdIds });
    pushHistory({
      label: "Auto-fill shifts",
      undo: async () => { for (const id of createdIds) await deleteShift(id); },
      redo: async () => {
        const nextIds: string[] = [];
        for (const draft of drafts) { const created = await createShift(draft); nextIds.push(created.id); }
        createdIds = nextIds;
      },
    });
  }, [buildAutoShifts, createShift, deleteShift, pushHistory, runAction, setStatus]);

  const openShift = (shift: any) => { setEditingShift(shift); setShowCreateModal(true); };
  const weekDates = getWeekDates(currentDate);
  const goToPrevious = () => setCurrentDate((prev) => {
    const next = new Date(prev);
    if (view === "week") next.setDate(next.getDate() - 7);
    else next.setMonth(next.getMonth() - 1);
    return next;
  });
  const goToNext = () => setCurrentDate((prev) => {
    const next = new Date(prev);
    if (view === "week") next.setDate(next.getDate() + 7);
    else next.setMonth(next.getMonth() + 1);
    return next;
  });

  const startDrag = (e: React.DragEvent<HTMLDivElement>, shiftId: string) => {
    e.dataTransfer.setData("text/plain", shiftId);
    const shift = shifts.find((item) => item.id === shiftId);
    const first = shift?.employees?.[0];
    console.log("Schedule.startDrag", { shiftId, first });
    setDragPreview({ visible: true, x: e.clientX, y: e.clientY, title: first ? companyMembers.find((member) => member.id === first)?.name ?? first : shift?.employeeName });
  };

  const dayActions = (date: string) => (
    <div className="flex flex-col gap-2">
      <button onClick={() => void handleAutoCreate(date)} className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"><Sparkles className="h-3.5 w-3.5" />Auto</button>
      <button onClick={() => void handlePasteShift(date)} disabled={!copiedShift} className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Copy className="h-3.5 w-3.5" />Paste</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
              <p className="mt-1 text-sm text-gray-500">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SaveBadge state={saveState} />
            {isAdmin && <button onClick={() => void handleUndo()} disabled={history.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Undo2 className="h-4 w-4" />Undo</button>}
            {isAdmin && <button onClick={() => void handleRedo()} disabled={redoHistory.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Redo2 className="h-4 w-4" />Redo</button>}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <button onClick={() => setView("week")} className={`px-4 py-2 ${view === "week" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}>Week</button>
              <button onClick={() => setView("month")} className={`px-4 py-2 ${view === "month" ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}>Month</button>
            </div>
            {isAdmin && <button onClick={() => { setEditingShift(null); setShowCreateModal(true); }} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm text-white hover:bg-emerald-600">New Shift</button>}
            <button onClick={goToPrevious} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={goToNext} className="rounded-lg border border-gray-200 p-2 hover:bg-gray-50"><ChevronRight className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      <CreateShiftModal visible={showCreateModal} onClose={() => { setShowCreateModal(false); setEditingShift(null); }} onSave={handleSaveShift} onDelete={handleDeleteShift} initialData={editingShift} employees={assignableEmployees} />

      {expandedDate && (() => {
        const d = parseYMD(expandedDate);
        return d ? <GanttDayDetail date={d} shifts={getShiftsForDate(d)} onClose={() => setExpandedDate(null)} companyMembers={companyMembers} onUpdateShift={(id, startTime, endTime) => handleSaveShift({ ...(shifts.find((shift) => shift.id === id) ?? {}), id, startTime, endTime })} onEditShift={openShift} onDeleteShift={handleDeleteShift} onCopyShift={handleCopyShift} onPasteShift={() => handlePasteShift(expandedDate)} canPaste={!!copiedShift} onAutoCreate={() => handleAutoCreate(expandedDate)} onUndo={handleUndo} onRedo={handleRedo} canUndo={history.length > 0} canRedo={redoHistory.length > 0} saveState={saveState} /> : null;
      })()}

      {view === "week" && !expandedDate && <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-gray-200">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="border-r border-gray-200 p-4 text-center last:border-r-0"><p className="text-sm font-semibold text-gray-700">{day}</p></div>)}</div>
        <div className="grid grid-cols-7">
          {weekDates.map((date, index) => {
            const dayShifts = getShiftsForDate(date);
            const dateStr = date.toISOString().split("T")[0];
            return <div key={index} onDragOver={(e) => { e.preventDefault(); setDragPreview((prev) => ({ ...prev, visible: true, x: e.clientX + 12, y: e.clientY + 12 })); }} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) { console.log("Schedule.onDrop", { id, dateStr }); void handleMoveShift(id, dateStr); } setDragPreview((prev) => ({ ...prev, visible: false })); }} className={`min-h-[220px] border-r border-b border-gray-200 p-3 last:border-r-0 ${isToday(date) ? "bg-blue-600/5" : "bg-white"}`}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <span onClick={() => setExpandedDate(dateStr)} className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full ${isToday(date) ? "bg-blue-600 font-bold text-white" : "text-gray-700"}`}>{date.getDate()}</span>
                {isAdmin ? dayActions(dateStr) : null}
              </div>
              <div className="space-y-2">{dayShifts.map((shift) => <motion.div key={shift.id} layoutId={shift.id ? `shift-${shift.id}` : undefined} draggable onDragStartCapture={(e) => startDrag(e, shift.id)} onClick={() => openShift(shift)} className="cursor-pointer rounded bg-blue-600 p-2 text-xs text-white hover:bg-blue-700">
                {(() => {
                  const meta = shiftMeta[shift.id] ?? { employees: shift.employees, employeeName: shift.employeeName ?? shift.name };
                  const names = meta.employees?.length ? meta.employees.map((employeeId: string) => companyMembers.find((member) => member.id === employeeId)?.name ?? employeeId) : [meta.employeeName ?? "Unassigned"];
                  return <>
                    {names.map((name: string) => <p key={name} className="truncate font-semibold">{name}</p>)}
                    <p className="text-white/75">{shift.startTime} - {shift.endTime}</p>
                    <div className="mt-2 flex gap-2">
                      {isAdmin ? (
                        <>
                          <button onClick={(event) => { event.stopPropagation(); handleCopyShift(shift); }} className="rounded bg-white/15 px-2 py-1 text-[11px] hover:bg-white/25">Copy</button>
                          <button onClick={(event) => { event.stopPropagation(); void handleDeleteShift(shift.id); }} className="rounded bg-white/15 px-2 py-1 text-[11px] hover:bg-white/25">Delete</button>
                        </>
                      ) : (
                        <div className="text-xs text-white/60">Read-only</div>
                      )}
                    </div>
                  </>;
                })()}
              </motion.div>)}</div>
            </div>;
          })}
        </div>
        {dragPreview.visible && <div className="pointer-events-none fixed z-50 rounded bg-gray-900 px-3 py-2 text-sm text-white shadow-lg" style={{ left: dragPreview.x, top: dragPreview.y }}>{dragPreview.title ?? "Moving shift"}</div>}
      </div>}

      {view === "month" && !expandedDate && <MonthGrid monthDate={currentDate} getShiftsForDate={getShiftsForDate} isToday={isToday} onMoveShift={handleMoveShift} onEditShift={openShift} companyMembers={companyMembers} shiftMeta={shiftMeta} onExpandDate={setExpandedDate} onCopyShift={handleCopyShift} onPasteShift={handlePasteShift} onAutoCreate={handleAutoCreate} canPaste={!!copiedShift} />}
    </div>
  );
}

function MonthGrid({ monthDate, getShiftsForDate, isToday, onMoveShift, onEditShift, companyMembers, shiftMeta, onExpandDate, onCopyShift, onPasteShift, onAutoCreate, canPaste }: {
  monthDate: Date;
  getShiftsForDate: (date: Date) => any[];
  isToday: (date: Date) => boolean;
  onMoveShift: (shiftId: string, date: string) => Promise<void>;
  onEditShift: (shift: any) => void;
  companyMembers: EmployeeOption[];
  shiftMeta: Record<string, { employees?: string[]; employeeName?: string }>;
  onExpandDate: (date: string) => void;
  onCopyShift: (shift: any) => void;
  onPasteShift: (date: string) => Promise<void>;
  onAutoCreate: (date: string) => Promise<void>;
  canPaste: boolean;
}) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = new Date(first); start.setDate(first.getDate() - first.getDay());
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0); end.setDate(end.getDate() + (6 - end.getDay()));
  const days: Date[] = []; const cursor = new Date(start); while (cursor <= end) { days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); }
  return <div className="grid grid-cols-7">
    {days.map((date, index) => {
      const dayShifts = getShiftsForDate(date);
      const dateStr = date.toISOString().split("T")[0];
      return <div key={index} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) void onMoveShift(id, dateStr); }} className={`min-h-[150px] border-r border-b border-gray-200 p-3 last:border-r-0 ${isToday(date) ? "bg-blue-600/5" : "bg-white"} ${date.getMonth() === monthDate.getMonth() ? "" : "bg-gray-50 text-gray-400"}`}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <span onClick={() => onExpandDate(dateStr)} className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-full ${isToday(date) ? "bg-blue-600 font-bold text-white" : "text-gray-700"}`}>{date.getDate()}</span>
          <div className="flex flex-col gap-2">
            <button onClick={() => void onAutoCreate(dateStr)} className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50">Auto</button>
            <button onClick={() => void onPasteShift(dateStr)} disabled={!canPaste} className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Paste</button>
          </div>
        </div>
        <div className="space-y-2">{dayShifts.map((shift) => <motion.div key={shift.id} layoutId={shift.id ? `shift-${shift.id}` : undefined} draggable onDragStartCapture={(e) => { e.dataTransfer.setData("text/plain", shift.id); }} onClick={() => onEditShift(shift)} className="cursor-pointer rounded bg-blue-600 p-2 text-xs text-white hover:bg-blue-700">
          {(() => {
            const meta = shiftMeta[shift.id] ?? { employees: shift.employees, employeeName: shift.employeeName ?? shift.name };
            const names = meta.employees?.length ? meta.employees.map((employeeId: string) => companyMembers.find((member) => member.id === employeeId)?.name ?? employeeId) : [meta.employeeName ?? "Unassigned"];
            return <>
              {names.map((name: string) => <p key={name} className="truncate font-semibold">{name}</p>)}
              <p className="text-white/75">{shift.startTime} - {shift.endTime}</p>
              <button onClick={(event) => { event.stopPropagation(); onCopyShift(shift); }} className="mt-2 rounded bg-white/15 px-2 py-1 text-[11px] hover:bg-white/25">Copy</button>
            </>;
          })()}
        </motion.div>)}</div>
      </div>;
    })}
  </div>;
}
