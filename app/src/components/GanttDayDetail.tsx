/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, LoaderCircle, Redo2, Sparkles, Trash2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";

function parseTimeToMinutes(t: string) {
  if (!t) return 0;
  const parts = t.split(":");
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function EmployeeAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" title={name} className="h-7 w-7 shrink-0 rounded-full border-2 border-blue-700 object-cover" />
  ) : <span aria-label={name} title={name} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-blue-700 bg-blue-100 text-[10px] font-semibold text-blue-900">{initials(name)}</span>;
}

export default function GanttDayDetail({
  date,
  shifts,
  onClose,
  companyMembers,
  onUpdateShift,
  onEditShift,
  onDeleteShift,
  onCopyShift,
  onPasteShift,
  canPaste,
  onAutoCreate,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saveState,
}: {
  date: Date;
  shifts: any[];
  onClose: () => void;
  companyMembers?: { id: string; name: string; avatarUrl?: string }[];
  onUpdateShift?: (id: string, startTime: string, endTime: string) => Promise<any> | void;
  onEditShift?: (shift: any) => void;
  onDeleteShift?: (id: string) => Promise<any> | void;
  onCopyShift?: (shift: any) => void;
  onPasteShift?: () => Promise<any> | void;
  canPaste?: boolean;
  onAutoCreate?: () => Promise<any> | void;
  onUndo?: () => Promise<any> | void;
  onRedo?: () => Promise<any> | void;
  canUndo?: boolean;
  canRedo?: boolean;
  saveState?: { kind: "idle" | "saving" | "saved" | "error"; message: string };
}) {
  const t = useTranslations("gantt");
  const common = useTranslations("common");
  const dayLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableHeight, setAvailableHeight] = useState<number>(420);
  const dragStateRef = useRef<{ id?: string; initStart: number; initEnd: number; startX?: number; type?: 'left' | 'right' | 'move' } | null>(null);

  // Manual DOM visual updates removed, React state is the single source of truth

  const normalizeClock = (m: number) => {
    const mm = ((m % 1440) + 1440) % 1440;
    const hh = Math.floor(mm / 60);
    const mi = Math.floor(mm % 60);
    return `${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
  };

  // UI formatter that preserves continuous minutes (can be >24 or negative)
  const formatTime = (m: number) => {
    const hh = Math.floor(m / 60);
    const mm = Math.abs(Math.floor(m % 60));
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  // per-shift row height
  const perShift = 48; // px per shift row

  useLayoutEffect(() => {
    function update() {
      if (!containerRef.current) {
        const h = Math.max(420, window.innerHeight - 240);
        setAvailableHeight(h);
        return;
      }
      const top = containerRef.current.getBoundingClientRect().top;
      const h = Math.max(420, window.innerHeight - top - 24);
      setAvailableHeight(h);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    console.log("GanttDayDetail.mountOrUpdate", { date: date.toISOString(), shiftsCount: shifts.length });
  }, [date, shifts.length]);

  // render finer ticks (30-min) to make gaps smaller
  const ticks = 48;

  const [viewHours, setViewHours] = useState<number>(24);
  const [viewStartMinutes, setViewStartMinutes] = useState<number>(0);

  // A shared shift is shown once per assigned employee here so each person remains visible.
  const ganttShifts = useMemo(() => (shifts || []).flatMap((shift: any, shiftIndex: number) => {
    const employeeIds = Array.isArray(shift.employees) && shift.employees.length > 0 ? shift.employees : [undefined];
    return employeeIds.map((employeeId: string | undefined, employeeIndex: number) => {
      const employee = employeeId ? companyMembers?.find((member) => member.id === employeeId) : undefined;
      const employeeName = employeeId
        ? employee?.name ?? employeeId
        : shift.employeeName ?? shift.name ?? "Unassigned";
      return { ...shift, ganttId: `${shift.id ?? `idx-${shiftIndex}`}:${employeeId ?? employeeIndex}`, sourceId: shift.id, employeeId, employeeName, avatarUrl: employee?.avatarUrl };
    });
  }), [companyMembers, shifts]);
  
  // local copy of shifts in minutes for live updates
  // include employee metadata so assignment persists when moving days
  const [localShifts, setLocalShifts] = useState<Record<string, { start: number; end: number; employees?: string[]; employeeName?: string }>>({});
  useEffect(() => {
    setLocalShifts((prev) => {
      const map: Record<string, { start: number; end: number; employees?: string[]; employeeName?: string }> = {};
      ganttShifts.forEach((s: any, idx: number) => {
        const st = parseTimeToMinutes(s.startTime || s.start || "00:00");
        const en = parseTimeToMinutes(s.endTime || s.end || "00:00");
        const key = s.ganttId ?? s.id ?? `idx-${idx}`;
        const existing = prev[key];
        map[key] = {
          start: st,
          end: en,
          employees: existing?.employees ?? s.employees,
          employeeName: existing?.employeeName ?? s.employeeName ?? s.name,
        };
      });
      console.debug("GanttDayDetail.localShifts set", { keysPreview: Object.keys(map).slice(0, 5), total: Object.keys(map).length });
      return map;
    });
  }, [ganttShifts]);

  // recompute view window based on local shift ranges
  useEffect(() => {
    const vals = Object.values(localShifts);
    if (vals.length === 0) {
      setViewStartMinutes(0);
      setViewHours(24);
      return;
    }
    const minStart = Math.min(...vals.map((v) => v.start));
    const maxEnd = Math.max(...vals.map((v) => v.end));
    // allow negative minStart
    const start = Math.min(0, minStart);
    const neededHours = Math.ceil((maxEnd - start) / 60);
    const hours = Math.min(48, Math.max(24, neededHours));
    setViewStartMinutes(start);
    setViewHours(hours);
    console.log("GanttDayDetail.viewWindow", { minStart, maxEnd, viewStartMinutes: start, viewHours: hours });
  }, [localShifts]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className="mt-6 relative"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold">{dayLabel}</h3>
            <p className="text-sm text-gray-500">{t("detailedView")}</p>
          </div>
          <div className="flex items-center gap-2">
            {saveState?.kind && saveState.kind !== "idle" && (
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm ${
                saveState.kind === "saved"
                  ? "bg-emerald-50 text-emerald-700"
                  : saveState.kind === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
              }`}>
                {saveState.kind === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>{saveState.message}</span>
              </div>
            )}
            <button onClick={() => onPasteShift?.()} disabled={!canPaste} className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 hover: cursor-pointer">
              <Copy className="h-4 w-4" />
              {common("paste")}
            </button>
            <button onClick={() => onAutoCreate?.()} className="inline-flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 hover:cursor-pointer">
              <Sparkles className="h-4 w-4" />
              {t("autoFillDay")}
            </button>
            <button onClick={onClose} className="px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50 hover:cursor-pointer">{common("close")}</button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm overflow-hidden transition-all duration-300">
          <div className="w-full overflow-x-auto">
            <div ref={containerRef} className="relative bg-gray-50 rounded" style={{ minWidth: 760, height: availableHeight }}>
              {/* time ticks (30-min intervals) */}
              <div className="absolute left-0 right-0 top-0 bottom-0">
                {Array.from({ length: ticks }).map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0" style={{ left: `${(i / (ticks - 1)) * 100}%`, width: i % 2 === 0 ? 1 : 0.5 }}>
                    <div className={`h-full border-l ${i % 2 === 0 ? 'border-dashed' : 'border-transparent'} border-gray-200`} />
                  </div>
                ))}
              </div>

              {/* hour labels (based on viewHours and viewStartMinutes) */}
              <div className="absolute -bottom-6 left-0 right-0 flex text-xs text-gray-500 px-1">
                {Array.from({ length: viewHours }).map((_, i) => {
                  const hourIndex = Math.floor(viewStartMinutes / 60) + i;
                  const label = `${String(hourIndex).padStart(2, '0')}:00`;
                  return <div key={i} style={{ position: 'absolute', left: `${(i / viewHours) * 100}%`, transform: 'translateX(-50%)' }}>{label}</div>;
                })}
              </div>

              {/* shift bars (draggable + resizable) */}
              <div className="absolute left-0 right-0 top-0 bottom-0">
                {ganttShifts.map((s, idx) => {
                  const id = s.ganttId ?? s.id ?? `idx-${idx}`;
                  const rawStart = parseTimeToMinutes(s.startTime || s.start || "00:00");
                  const rawEnd = parseTimeToMinutes(s.endTime || s.end || "00:00");
                  const ls = localShifts[id] ?? { start: rawStart, end: rawEnd };
                  const dur = Math.max(15, ls.end - ls.start);
                  const left = ((ls.start - viewStartMinutes) / (viewHours * 60)) * 100;
                  const width = (dur / (viewHours * 60)) * 100;
                  const assignedEmployeeName = localShifts[id]?.employeeName ?? s.employeeName ?? s.name;
                  const empName = assignedEmployeeName || 'Unassigned';

                  const top = 16 + idx * perShift; // simple stacking

                  // helper to convert pixel dx to minutes (snapped later)
                  const pxToMinutes = (dx: number) => {
                    const containerW = containerRef.current?.getBoundingClientRect().width || 760;
                    return (dx / containerW) * viewHours * 60;
                  };

                  const ensureVisible = (newStart: number) => {
                    const cw = containerRef.current?.getBoundingClientRect().width || 760;
                    const leftPx = ((newStart - viewStartMinutes) / (viewHours * 60)) * cw;
                    if (containerRef.current) containerRef.current.scrollLeft = Math.max(0, leftPx - cw * 0.15);
                  };

                  return (
                    <React.Fragment key={id}>
                      <motion.div
                        layout
                        layoutId={`gantt-shift-${id}`}
                        drag="x"
                        dragMomentum={false}
                        onDragStart={() => {
                          dragStateRef.current = { id, initStart: ls.start, initEnd: ls.end };
                          console.debug("GanttDayDetail.dragStart", { id, initStart: ls.start, initEnd: ls.end });
                        }}
                        onDrag={(e, info) => {
                          const st0 = dragStateRef.current?.initStart ?? ls.start;
                          const en0 = dragStateRef.current?.initEnd ?? ls.end;
                          const minutes = pxToMinutes(info.offset.x);
                          const snappedDelta = Math.round(minutes / 15) * 15;
                          const newStart = st0 + snappedDelta;
                          const newEnd = en0 + snappedDelta;
                          setLocalShifts((prev) => {
                            const cur = prev[id] ?? { start: st0, end: en0 };
                            if (cur.start === newStart && cur.end === newEnd) return prev;
                            return { ...prev, [id]: { ...(prev[id] ?? { employees: s.employees, employeeName: s.employeeName ?? s.name }), start: newStart, end: newEnd } };
                          });
                          if (newStart < viewStartMinutes || newEnd > viewStartMinutes + viewHours * 60) {
                            const minStart = Math.min(newStart, viewStartMinutes);
                            const maxEnd = Math.max(newEnd, viewStartMinutes + viewHours * 60);
                            const startM = Math.min(0, minStart);
                            const hoursNeeded = Math.min(48, Math.max(24, Math.ceil((maxEnd - startM) / 60)));
                            setViewStartMinutes(startM);
                            setViewHours(hoursNeeded);
                          }
                          console.debug("GanttDayDetail.drag", { id, offsetX: info?.offset?.x, snappedDelta, newStart, newEnd });
                        }}
                        onDragEnd={(_, info) => {
                          const st0 = dragStateRef.current?.initStart ?? ls.start;
                          const en0 = dragStateRef.current?.initEnd ?? ls.end;
                          const minutes = Math.round(pxToMinutes(info.offset.x) / 15) * 15;
                          let newStart = st0 + minutes;
                          let newEnd = en0 + minutes;
                          newStart = Math.max(-1440, Math.min(2880, newStart));
                          newEnd = Math.max(newStart + 15, Math.min(2880, newEnd));
                          setLocalShifts((prevMap) => {
                            const cur = prevMap[id] ?? { start: st0, end: en0 };
                            if (cur.start === newStart && cur.end === newEnd) return prevMap;
                            return { ...prevMap, [id]: { ...(prevMap[id] ?? { employees: s.employees, employeeName: s.employeeName ?? s.name }), start: newStart, end: newEnd } };
                          });
                          const newStartStr = normalizeClock(newStart);
                          const newEndStr = normalizeClock(newEnd);
                          console.log("GanttDayDetail.dragEnd", { id, newStartStr, newEndStr });
                          if (onUpdateShift && s.sourceId) onUpdateShift(s.sourceId, newStartStr, newEndStr);
                          setTimeout(() => ensureVisible(newStart), 40);
                        }}
                        className="absolute rounded shadow-md bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center px-3 text-sm cursor-grab touch-none"
                        style={{ left: `${left}%`, width: `${width}%`, top: top, height: perShift - 10, zIndex: 20, touchAction: 'none' }}
                        whileTap={{ cursor: 'grabbing' }}
                      >
                        <EmployeeAvatar name={empName} avatarUrl={s.avatarUrl} />
                        <div className="ml-2 flex-1 truncate pointer-events-none">
                          <div className="font-semibold">{empName}</div>
                          <div className="text-xs opacity-80">{(() => {
                            const cur = localShifts[id] ?? { start: rawStart, end: rawEnd };
                            return `${formatTime(cur.start)} - ${formatTime(cur.end)}`;
                          })()}</div>
                        </div>
                      </motion.div>
                      {/* left edge (resize start) */}
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              const px = e.clientX;
                              dragStateRef.current = { id, initStart: ls.start, initEnd: ls.end, startX: px, type: 'left' };
                              e.currentTarget.setPointerCapture?.(e.pointerId);
                              const onMove = (ev: PointerEvent) => {
                                const state = dragStateRef.current;
                                if (!state || state.id !== id) return;
                                const dx = ev.clientX - (state.startX ?? 0);
                                const minutes = Math.round(pxToMinutes(dx) / 15) * 15;
                                let newStart = state.initStart + minutes;
                                newStart = Math.min(newStart, state.initEnd - 15);
                                setLocalShifts((prev) => {
                                  const cur = prev[id] ?? { start: state.initStart, end: state.initEnd };
                                  if (cur.start === newStart && cur.end === state.initEnd) return prev;
                                  return { ...prev, [id]: { ...(prev[id] ?? { employees: s.employees, employeeName: s.employeeName ?? s.name }), start: newStart, end: state.initEnd } };
                                });
                                if (newStart < viewStartMinutes) {
                                  setViewStartMinutes(Math.min(0, newStart));
                                  setViewHours(48);
                                }
                              };
                              const onUp = (ev: PointerEvent) => {
                                const state = dragStateRef.current;
                                if (!state || state.id !== id) return;
                                const dx = ev.clientX - (state.startX ?? 0);
                                const minutes = Math.round(pxToMinutes(dx) / 15) * 15;
                                let newStart = state.initStart + minutes;
                                newStart = Math.max(-1440, Math.min(state.initEnd - 15, newStart));
                                setLocalShifts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { employees: s.employees, employeeName: s.employeeName ?? s.name }), start: newStart, end: state.initEnd } }));
                                const newStartStr = normalizeClock(newStart);
                                const newEndStr = normalizeClock(state.initEnd);
                                console.log("GanttDayDetail.resizeStart", { id, newStartStr, newEndStr });
                                if (onUpdateShift && s.sourceId) onUpdateShift(s.sourceId, newStartStr, newEndStr);
                                setTimeout(() => ensureVisible(newStart), 40);
                                window.removeEventListener('pointermove', onMove as any);
                                window.removeEventListener('pointerup', onUp as any);
                                dragStateRef.current = null;
                              };
                              window.addEventListener('pointermove', onMove as any);
                              window.addEventListener('pointerup', onUp as any);
                            }}
                            className="absolute"
                            style={{ left: `calc(${left}% - 8px)`, top: top + 6, width: 12, height: perShift - 22, zIndex: 30, pointerEvents: 'auto' }}
                          >
                            <div className="w-2 h-full bg-transparent cursor-ew-resize pointer-events-auto" />
                          </div>

                      {/* right edge (resize end) */}
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          const px = e.clientX;
                          dragStateRef.current = { id, initStart: ls.start, initEnd: ls.end, startX: px, type: 'right' };
                          e.currentTarget.setPointerCapture?.(e.pointerId);
                          const onMove = (ev: PointerEvent) => {
                            const state = dragStateRef.current;
                            if (!state || state.id !== id) return;
                            const dx = ev.clientX - (state.startX ?? 0);
                            const minutes = Math.round(pxToMinutes(dx) / 15) * 15;
                            const newEnd = Math.max(state.initStart + 15, state.initEnd + minutes);
                            setLocalShifts((prev) => {
                              const cur = prev[id] ?? { start: state.initStart, end: state.initEnd };
                              if (cur.start === state.initStart && cur.end === newEnd) return prev;
                              return { ...prev, [id]: { ...(prev[id] ?? { employees: s.employees, employeeName: s.employeeName ?? s.name }), start: state.initStart, end: newEnd } };
                            });
                            if (newEnd > viewStartMinutes + viewHours * 60) {
                              setViewHours(48);
                            }
                          };
                          const onUp = (ev: PointerEvent) => {
                            const state = dragStateRef.current;
                            if (!state || state.id !== id) return;
                            const dx = ev.clientX - (state.startX ?? 0);
                            const minutes = Math.round(pxToMinutes(dx) / 15) * 15;
                            const newEnd = Math.max(state.initStart + 15, Math.min(2880, Math.max(state.initStart + 15, state.initEnd + minutes)));
                            setLocalShifts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { employees: s.employees, employeeName: s.employeeName ?? s.name }), start: state.initStart, end: newEnd } }));
                            const newStartStr = normalizeClock(state.initStart);
                            const newEndStr = normalizeClock(newEnd);
                              console.log("GanttDayDetail.resizeEnd", { id, newStartStr, newEndStr });
                              if (onUpdateShift && s.sourceId) onUpdateShift(s.sourceId, newStartStr, newEndStr);
                            setTimeout(() => ensureVisible(state.initStart), 40);
                            window.removeEventListener('pointermove', onMove as any);
                            window.removeEventListener('pointerup', onUp as any);
                            dragStateRef.current = null;
                          };
                          window.addEventListener('pointermove', onMove as any);
                          window.addEventListener('pointerup', onUp as any);
                        }}
                        className="absolute"
                        style={{ left: `calc(${left + width}% - 8px)`, top: top + 6, width: 12, height: perShift - 22, zIndex: 30, pointerEvents: 'auto' }}
                      >
                        <div className="w-2 h-full bg-transparent cursor-ew-resize pointer-events-auto" />
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shifts.map((shift, index) => {
              const id = shift.id ?? `idx-${index}`;
              const local = localShifts[id];
              const assignedEmployees = local?.employees ?? shift.employees ?? [];
              const employeeLabel = assignedEmployees.length > 0
                ? assignedEmployees
                    .map((employeeId: string) => companyMembers?.find((member) => member.id === employeeId)?.name ?? employeeId)
                    .join(", ")
                : local?.employeeName ?? shift.employeeName ?? shift.name ?? "Unassigned";

              return (
                <div key={id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{employeeLabel}</p>
                      <p className="text-sm text-gray-500">{shift.role ?? "Shift"}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-600">
                      {formatTime(local?.start ?? parseTimeToMinutes(shift.startTime || shift.start || "00:00"))}
                      {" - "}
                      {formatTime(local?.end ?? parseTimeToMinutes(shift.endTime || shift.end || "00:00"))}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => onEditShift?.(shift)} className="rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                      Edit
                    </button>
                    <button onClick={() => onCopyShift?.(shift)} className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button onClick={() => onDeleteShift?.(shift.id)} className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
            {shifts.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                No shifts yet for this day. Use Auto Fill Day or create one from the schedule.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
