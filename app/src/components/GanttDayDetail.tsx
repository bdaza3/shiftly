"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function parseTimeToMinutes(t: string) {
  if (!t) return 0;
  const parts = t.split(":");
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export default function GanttDayDetail({
  date,
  shifts,
  onClose,
  companyMembers,
  onUpdateShift,
}: {
  date: Date;
  shifts: any[];
  onClose: () => void;
  companyMembers?: { id: string; name: string }[];
  onUpdateShift?: (id: string, startTime: string, endTime: string) => Promise<any> | void;
}) {
  const dayLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [availableHeight, setAvailableHeight] = useState<number>(420);
  const dragStateRef = useRef<{ id?: string; initStart: number; initEnd: number; startX?: number; type?: 'left' | 'right' | 'move' } | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Manual DOM visual updates removed — React state is the single source of truth

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
  const base = 88; // header/padding inside chart

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

  // render finer ticks (30-min) to make gaps smaller
  const ticks = 48;

  const [viewHours, setViewHours] = useState<number>(24);
  const [viewStartMinutes, setViewStartMinutes] = useState<number>(0);
  
  // local copy of shifts in minutes for live updates
  const [localShifts, setLocalShifts] = useState<Record<string, { start: number; end: number }>>({});
  useEffect(() => {
    const map: Record<string, { start: number; end: number }> = {};
    (shifts || []).forEach((s: any) => {
      const st = parseTimeToMinutes(s.startTime || s.start || "00:00");
      const en = parseTimeToMinutes(s.endTime || s.end || "00:00");
      map[s.id ?? `${Math.random()}`] = { start: st, end: en };
    });
    setLocalShifts(map);
  }, [shifts]);

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
            <p className="text-sm text-gray-500">Detailed Gantt view</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50">Close</button>
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
                {shifts.map((s, idx) => {
                  const id = s.id ?? `idx-${idx}`;
                  const rawStart = parseTimeToMinutes(s.startTime || s.start || "00:00");
                  const rawEnd = parseTimeToMinutes(s.endTime || s.end || "00:00");
                  const ls = localShifts[id] ?? { start: rawStart, end: rawEnd };
                  const dur = Math.max(15, ls.end - ls.start);
                  const left = ((ls.start - viewStartMinutes) / (viewHours * 60)) * 100;
                  const width = (dur / (viewHours * 60)) * 100;
                  const right = 100 - (left + width);
                  const empName = (s.employees && s.employees.length > 0 && companyMembers)
                    ? (companyMembers.find((c) => c.id === s.employees[0])?.name ?? s.employees[0])
                    : s.employeeName ?? s.name ?? 'Unassigned';

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
                    <React.Fragment key={s.id ?? idx}>
                      <motion.div
                        layout
                        layoutId={s.id ? `shift-${s.id}` : `shift-idx-${idx}`}
                        drag="x"
                        dragMomentum={false}
                        onDragStart={() => {
                          dragStateRef.current = { id, initStart: ls.start, initEnd: ls.end };
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
                            return { ...prev, [id]: { start: newStart, end: newEnd } };
                          });
                          if (newStart < viewStartMinutes || newEnd > viewStartMinutes + viewHours * 60) {
                            const minStart = Math.min(newStart, viewStartMinutes);
                            const maxEnd = Math.max(newEnd, viewStartMinutes + viewHours * 60);
                            const startM = Math.min(0, minStart);
                            const hoursNeeded = Math.min(48, Math.max(24, Math.ceil((maxEnd - startM) / 60)));
                            setViewStartMinutes(startM);
                            setViewHours(hoursNeeded);
                          }
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
                            return { ...prevMap, [id]: { start: newStart, end: newEnd } };
                          });
                          const newStartStr = normalizeClock(newStart);
                          const newEndStr = normalizeClock(newEnd);
                          if (onUpdateShift && s.id) onUpdateShift(s.id, newStartStr, newEndStr);
                          setTimeout(() => ensureVisible(newStart), 40);
                        }}
                        className="absolute rounded shadow-md bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white flex items-center px-3 text-sm cursor-grab touch-none"
                        style={{ left: `${left}%`, width: `${width}%`, top: top, height: perShift - 10, zIndex: 20, touchAction: 'none' }}
                        whileTap={{ cursor: 'grabbing' }}
                      >
                        <div className="flex-1 truncate pointer-events-none">
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
                                  return { ...prev, [id]: { start: newStart, end: state.initEnd } };
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
                                setLocalShifts((prev) => ({ ...prev, [id]: { start: newStart, end: state.initEnd } }));
                                const newStartStr = normalizeClock(newStart);
                                const newEndStr = normalizeClock(state.initEnd);
                                if (onUpdateShift && s.id) onUpdateShift(s.id, newStartStr, newEndStr);
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
                            let newEnd = Math.max(state.initStart + 15, state.initEnd + minutes);
                            setLocalShifts((prev) => {
                              const cur = prev[id] ?? { start: state.initStart, end: state.initEnd };
                              if (cur.start === state.initStart && cur.end === newEnd) return prev;
                              return { ...prev, [id]: { start: state.initStart, end: newEnd } };
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
                            let newEnd = Math.max(state.initStart + 15, state.initEnd + minutes);
                            newEnd = Math.max(state.initStart + 15, Math.min(2880, newEnd));
                            setLocalShifts((prev) => ({ ...prev, [id]: { start: state.initStart, end: newEnd } }));
                            const newStartStr = normalizeClock(state.initStart);
                            const newEndStr = normalizeClock(newEnd);
                            if (onUpdateShift && s.id) onUpdateShift(s.id, newStartStr, newEndStr);
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
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
