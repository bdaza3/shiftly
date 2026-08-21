/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ClipboardList, Copy, LoaderCircle, Plus, Redo2, Sparkles, Trash2, Undo2, PencilIcon } from "lucide-react";
import CreateShiftModal from "../../components/CreateShiftModal";
import { useAuth } from "../../hooks/useAuth";
import { useCompany } from "../../hooks/useCompany";
import { useRole } from "../../hooks/useRole";
import { useCompanyMembers } from "../../hooks/useCompanyMembers";
import { useShifts } from "../../hooks/useShifts";
import { useTranslations } from "next-intl";

type SaveState = { kind: "idle" | "saving" | "saved" | "error"; message: string };
type HistoryEntry = { label: string; undo: () => Promise<void>; redo: () => Promise<void> };
type ShiftDraft = { date: string; startTime: string; endTime: string; employees: string[]; employeeId?: string; employeeName?: string; role: string; location?: string; company_id?: string };

const EMPTY_STATE: SaveState = { kind: "idle", message: "" };

function SaveBadge({ state }: { state: SaveState }) {
  if (state.kind === "idle") return null;
  const tone = state.kind === "saved" ? "bg-emerald-50 text-emerald-700" : state.kind === "error" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";
  return <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${tone}`}>{state.kind === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}<span>{state.message}</span></div>;
}

export function ManageShifts() {
  const t = useTranslations("admin")
  const { selected } = useCompany();
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { members } = useCompanyMembers(selected?.id ?? null);
  const { shifts, loading, createShift, updateShift, deleteShift } = useShifts(selected?.id);
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoHistory, setRedoHistory] = useState<HistoryEntry[]>([]);
  const [saveState, setSaveState] = useState<SaveState>(EMPTY_STATE);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const employees = useMemo(() => (members || []).map((member: any) => ({ id: member.id, name: member.full_name ?? member.name ?? member.email ?? member.user_id ?? "Unknown", role: member.role ?? "Employee" })).filter((employee: any) => employee.id !== user?.id), [members, user?.id]);
  const assignable = useMemo(() => employees.filter((employee) => !["admin", "manager"].includes((employee.role || "").toLowerCase())), [employees]);

  const setStatus = useCallback((kind: SaveState["kind"], message: string) => {
    if (resetRef.current) clearTimeout(resetRef.current);
    setSaveState({ kind, message });
    if (kind === "saved" || kind === "error") resetRef.current = setTimeout(() => setSaveState(EMPTY_STATE), 2200);
  }, []);

  useEffect(() => () => { if (resetRef.current) clearTimeout(resetRef.current); }, []);

  const withCompany = useCallback((draft: ShiftDraft) => ({ ...draft, ...(selected?.id ? { company_id: selected.id } : {}) }), [selected?.id]);
  const toDraft = useCallback((shift: any): ShiftDraft => {
    const employeesForShift = shift.employees ?? [];
    const employeeId = shift.employeeId ?? employeesForShift[0];
    const employeeName = shift.employeeName ?? (employeeId ? employees.find((employee) => employee.id === employeeId)?.name : undefined);
    return { date: shift.date, startTime: shift.startTime ?? "09:00", endTime: shift.endTime ?? "17:00", employees: employeesForShift, ...(employeeId ? { employeeId } : {}), ...(employeeName ? { employeeName } : {}), role: shift.role ?? "Staff", ...(shift.location ? { location: shift.location } : {}), ...(selected?.id ? { company_id: selected.id } : {}) };
  }, [employees, selected?.id]);

  const parseYMD = (s?: string | null) => {
    if (!s) return null;
    const parts = String(s).split("-").map((x) => parseInt(x, 10));
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d);
  };

  const runAction = useCallback(async (label: string, action: () => Promise<void>) => {
    setStatus("saving", label);
    console.log("ManageShifts.runAction start", { label });
    try {
      await action();
      setStatus("saved", "Saved changes");
      console.log("ManageShifts.runAction success", { label });
    } catch (error) {
      console.error(label, error);
      console.log("ManageShifts.runAction error", { label, error });
      setStatus("error", "Could not save changes");
      throw error;
    }
  }, [setStatus]);

  const pushHistory = (entry: HistoryEntry) => { setHistory((prev) => [...prev, entry]); setRedoHistory([]); };
  const handleUndo = async () => { const entry = history[history.length - 1]; if (!entry) return; setHistory((prev) => prev.slice(0, -1)); try { await runAction(`Undoing ${entry.label.toLowerCase()}`, entry.undo); setRedoHistory((prev) => [...prev, entry]); } catch { setHistory((prev) => [...prev, entry]); } };
  const handleRedo = async () => { const entry = redoHistory[redoHistory.length - 1]; if (!entry) return; setRedoHistory((prev) => prev.slice(0, -1)); try { await runAction(`Redoing ${entry.label.toLowerCase()}`, entry.redo); setHistory((prev) => [...prev, entry]); } catch { setRedoHistory((prev) => [...prev, entry]); } };

  const handleSave = async (payload: any) => {
    const draft = withCompany(payload);
    console.log("ManageShifts.handleSave called", { payload, selectedCompany: selected?.id });
    if (payload.id) {
      const existing = shifts.find((shift) => shift.id === payload.id); if (!existing) return;
      const before = toDraft(existing);
      await runAction("Saving shift", async () => { await updateShift(payload.id, draft); });
      console.log("ManageShifts.saved shift", { id: payload.id });
      pushHistory({ label: "Edit shift", undo: async () => { await updateShift(payload.id, before); }, redo: async () => { await updateShift(payload.id, draft); } });
    } else {
      let createdId = "";
      await runAction("Creating shift", async () => { const created = await createShift(draft); createdId = created.id; });
      console.log("ManageShifts.created shift", { createdId });
      pushHistory({ label: "Create shift", undo: async () => { await deleteShift(createdId); }, redo: async () => { const recreated = await createShift(draft); createdId = recreated.id; } });
    }
    setShowModal(false);
    setEditingShift(null);
  };

  const handleDelete = async (id: string) => {
    console.log("ManageShifts.handleDelete called", { id });
    const existing = shifts.find((shift) => shift.id === id); if (!existing) return;
    const before = toDraft(existing); let activeId = id;
    await runAction("Deleting shift", async () => { await deleteShift(id); });
    console.log("ManageShifts.deleted shift", { id });
    pushHistory({ label: "Delete shift", undo: async () => { const restored = await createShift(before); activeId = restored.id; }, redo: async () => { await deleteShift(activeId); } });
    setShowModal(false);
    setEditingShift(null);
  };

  const handleCopy = async (shift: any) => {
    console.log("ManageShifts.handleCopy called", { shiftId: shift?.id });
    const draft = withCompany(toDraft(shift));
    let createdId = "";
    await runAction("Copying shift", async () => { const created = await createShift(draft); createdId = created.id; });
    console.log("ManageShifts.copied shift", { createdId });
    pushHistory({ label: "Copy shift", undo: async () => { await deleteShift(createdId); }, redo: async () => { const recreated = await createShift(draft); createdId = recreated.id; } });
  };

  const handleAutoCreate = async () => {
    const today = new Date().toISOString().split("T")[0];
    console.log("ManageShifts.handleAutoCreate start", { today });
    const existingToday = shifts.filter((shift) => shift.date === today);
    const busy = new Set(existingToday.flatMap((shift) => shift.employees ?? []));
    const counts = new Map(assignable.map((employee) => [employee.id, shifts.reduce((sum, shift) => sum + ((shift.employees ?? []).includes(employee.id) ? 1 : 0), 0)]));
    const available = [...assignable].filter((employee) => !busy.has(employee.id)).sort((left, right) => ((counts.get(left.id) ?? 0) - (counts.get(right.id) ?? 0)) || left.name.localeCompare(right.name));
    const drafts = [{ startTime: "07:00", endTime: "15:00", role: "Opening" }, { startTime: "09:00", endTime: "17:00", role: "Mid" }, { startTime: "15:00", endTime: "23:00", role: "Closing" }]
      .slice(0, available.length)
      .map((template, index) => withCompany({ date: today, ...template, employees: [available[index].id], employeeId: available[index].id, employeeName: available[index].name }));
    console.log("ManageShifts.handleAutoCreate computed", { availableCount: available.length, draftsCount: drafts.length });
    if (!drafts.length) return setStatus("error", "No available employees for auto-fill");
    let createdIds: string[] = [];
    await runAction("Auto-filling shifts", async () => { createdIds = []; for (const draft of drafts) { const created = await createShift(draft); createdIds.push(created.id); } });
    console.log("ManageShifts.handleAutoCreate created", { createdCount: createdIds.length, createdIds });
    pushHistory({ label: "Auto-fill shifts", undo: async () => { for (const id of createdIds) await deleteShift(id); }, redo: async () => { const nextIds: string[] = []; for (const draft of drafts) { const created = await createShift(draft); nextIds.push(created.id); } createdIds = nextIds; } });
  };

  return <div className="space-y-6">
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ClipboardList className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('manageShifts')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('manageShiftsDescription')}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SaveBadge state={saveState} />
          {isAdmin && (
            <>
              <button onClick={() => { console.log("ManageShifts.click Undo"); void handleUndo(); }} disabled={history.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Undo2 className="h-4 w-4" />{t('undo')}</button>
              <button onClick={() => { console.log("ManageShifts.click Redo"); void handleRedo(); }} disabled={redoHistory.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><Redo2 className="h-4 w-4" />{t('redo')}</button>
              <button onClick={() => { console.log("ManageShifts.click Auto Today"); void handleAutoCreate(); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 hover:cursor-pointer"><Sparkles className="h-4 w-4" />Auto Today</button>
              <button onClick={() => { console.log("ManageShifts.click New Shift"); setEditingShift(null); setShowModal(true); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 hover:cursor-pointer"><Plus className="h-5 w-5" />{t('newShift')}</button>
            </>
          )}
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-gray-200"><th className="p-4 text-left font-semibold text-gray-700">Employee</th><th className="p-4 text-left font-semibold text-gray-700">Date</th><th className="p-4 text-left font-semibold text-gray-700">Time</th><th className="p-4 text-left font-semibold text-gray-700">Role</th><th className="p-4 text-left font-semibold text-gray-700">Location</th><th className="p-4 text-left font-semibold text-gray-700">Actions</th></tr></thead>
          <tbody>
            {(loading ? [] : shifts).map((shift: any) => {
              const names = (shift.employees && shift.employees.length)
                ? shift.employees.map((id: string) => employees.find((e: any) => e.id === id)?.name ?? id)
                : (shift.employeeName ? [shift.employeeName] : []);
              const employeeLabel = names.length ? names.join(", ") : "Unassigned";
              const dateDisplay = (() => { const d = parseYMD(shift.date); return d ? d.toLocaleDateString() : "-"; })();
              return <tr key={shift.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{employeeLabel}</td>
                <td className="p-4 text-gray-700">{dateDisplay}</td>
                <td className="p-4 text-gray-700">{shift.startTime ?? "--:--"} - {shift.endTime ?? "--:--"}</td>
                <td className="p-4 text-gray-700">{shift.role ?? "-"}</td>
                <td className="p-4 text-gray-700">{shift.location ?? "-"}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <button onClick={() => { console.log("ManageShifts.click Edit", { shiftId: shift.id }); setEditingShift(shift); setShowModal(true); }} className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 hover:cursor-pointer"><PencilIcon className="h-4 w-4" />Edit</button>
                        <button onClick={() => { console.log("ManageShifts.click Copy", { shiftId: shift.id }); void handleCopy(shift); }} className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 hover:cursor-pointer"><Copy className="h-4 w-4" />Copy</button>
                        <button onClick={() => { console.log("ManageShifts.click Delete", { shiftId: shift.id }); void handleDelete(shift.id); }} className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:cursor-pointer"><Trash2 className="h-4 w-4" />Delete</button>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">Restricted</div>
                    )}
                  </div>
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>

    <CreateShiftModal visible={showModal} onClose={() => { setShowModal(false); setEditingShift(null); }} onSave={handleSave} onDelete={handleDelete} initialData={editingShift} employees={employees} />
  </div>;
}
