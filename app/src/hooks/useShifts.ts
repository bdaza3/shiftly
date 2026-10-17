import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export type Shift = {
  id: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  employees?: string[];
  [k: string]: any;
};

const mapRow = (r: any): Shift => ({
  id: r.id,
  date: r.date,
  startTime: r.start_time ?? r.startTime,
  endTime: r.end_time ?? r.endTime,
  employees: r.employees ?? [],
  // normalize DB fields to camelCase for the UI
  employeeName: r.employee_name ?? r.employeeName ?? (Array.isArray(r.employees) && r.employees.length > 0 ? r.employees[0] : undefined),
  employeeId: r.employee_id ?? r.employeeId ?? undefined,
  ...r,
});

async function readAssignments(shiftId: string) {
  const { data, error } = await supabase
    .from("shift_assignments")
    .select("shift_id, user_id")
    .eq("shift_id", shiftId);
  if (error) throw error;
  return data ?? [];
}

async function replaceAssignments(shiftId: string, userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds)];
  const previous = await readAssignments(shiftId);
  const { error: deleteError } = await supabase
    .from("shift_assignments")
    .delete()
    .eq("shift_id", shiftId);
  if (deleteError) throw deleteError;

  if (uniqueUserIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("shift_assignments")
    .insert(uniqueUserIds.map((user_id) => ({ shift_id: shiftId, user_id })));
  if (!insertError) return;

  // PostgREST doesn't provide a transaction spanning these requests. Restore
  // the previous assignments if inserting the replacement set fails.
  if (previous.length > 0) {
    const { error: restoreError } = await supabase
      .from("shift_assignments")
      .insert(previous);
    if (restoreError) {
      throw new Error(`Could not save shift assignments and could not restore the previous assignments: ${restoreError.message}`, { cause: insertError });
    }
  }
  throw insertError;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function useShifts(companyId?: string | null) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    if (!companyId) {
      setShifts([]);
      setLoading(false);
      return;
    }

    let q = supabase.from("shifts").select("*").order("date", { ascending: true });
    q = q.eq('company_id', companyId);
    const { data, error } = await q;
    if (error) {
      console.error("useShifts fetch", error);
      setShifts([]);
    } else {
      // enrich shifts with assignments -> employee ids -> profile names when possible
      const rows = (data || []);
      try {
        const shiftIds = rows.map((r: any) => r.id).filter(Boolean);
        if (shiftIds.length > 0) {
          let assignments: any[] = [];
          try {
            const { data: aData } = await supabase.from('shift_assignments').select('shift_id, user_id').in('shift_id', shiftIds);
            assignments = aData || [];
          } catch (e) {
            // ignore assignment read errors (RLS or missing table)
            assignments = [];
          }

          const assignMap = new Map<string, string[]>();
          const userIdsSet = new Set<string>();
          for (const a of assignments) {
            if (!a?.shift_id || !a?.user_id) continue;
            const arr = assignMap.get(a.shift_id) || [];
            arr.push(a.user_id);
            assignMap.set(a.shift_id, arr);
            userIdsSet.add(a.user_id);
          }

          const userIds = Array.from(userIdsSet);
          let profiles: any[] = [];
          if (userIds.length > 0) {
            try {
              const { data: pData } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
              profiles = pData || [];
            } catch (e) {
              profiles = [];
            }
          }
          const profileMap = new Map((profiles || []).map((p:any) => [p.id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()]));

          const enriched = rows.map((r: any) => {
            const empIds = assignMap.get(r.id) || [];
            const employees = Array.isArray(r.employees) && r.employees.length > 0 ? r.employees : empIds;
            const firstEmp = employees && employees.length > 0 ? employees[0] : undefined;
            const employeeName = r.employee_name ?? r.employeeName ?? (firstEmp ? (profileMap.get(firstEmp) || firstEmp) : undefined);
            return { ...r, employees, employee_name: employeeName, employeeName };
          });

          setShifts(enriched.map(mapRow));
        } else {
          setShifts(rows.map(mapRow));
        }
      } catch (e) {
        console.warn('useShifts: enrichment failed', e);
        setShifts(rows.map(mapRow));
      }
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    fetchShifts();

    // subscribe to realtime changes (supabase-js v2 channel API)
    // guard subscribe/remove logic to avoid unhandled promise rejections
    let channel: any = null;
    try {
      channel = supabase
        .channel("public:shifts")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "shifts" },
          (payload: any) => {
            try {
              const ev = payload.eventType; // INSERT, UPDATE, DELETE
              const row = payload.new ?? payload.old;
              if (!row) return;
              // ignore events for other companies
              if (companyId && row.company_id && row.company_id !== companyId) return;
              if (ev === "INSERT") setShifts((s) => [...s, mapRow(row)]);
              if (ev === "UPDATE") setShifts((s) => s.map((sh) => (sh.id === row.id ? mapRow(row) : sh)));
              if (ev === "DELETE") setShifts((s) => s.filter((sh) => sh.id !== row.id));
            } catch (err) {
              console.error("realtime handler", err);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("useShifts: realtime subscribe failed", err);
      channel = null;
    }

    return () => {
      // attempt to unsubscribe and remove channel without awaiting to avoid async cleanup issues
      try {
        if (channel && typeof channel.unsubscribe === 'function') {
          // unsubscribe returns a promise; attach catch to avoid unhandled rejection
          try { channel.unsubscribe().catch(() => {}); } catch (e) { /* ignore */ }
        }
        if (channel && typeof (supabase as any).removeChannel === 'function') {
          try { (supabase as any).removeChannel(channel).catch(() => {}); } catch (e) { /* ignore */ }
        }
      } catch (err) {
        // ignore any cleanup errors
      }
    };
  }, [fetchShifts, companyId]);

  const createShift = async (payload: Partial<Shift>) => {
    // build row payload; include employee_id if we have at least one employee selected
    const row: any = {
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      role: payload.role ?? "Employee",
    };
    // attach company if available
    if (!row.company_id && companyId) row.company_id = companyId;
    if (payload.employees) row.employees = payload.employees;
    if (payload.location) row.location = payload.location;
    // include employee_name if provided (some schemas require it)
    if (payload.employeeName) row.employee_name = payload.employeeName;

    let { data, error } = await supabase.from("shifts").insert([row]).select().single();
    // handle case where DB doesn't have `employees`, `employee_name` or `employee_id` columns yet
    if (error && error.code === "PGRST204") {
      const msg = String(error.message || "");
      if (/employees/.test(msg) || /employee_name/.test(msg) || /employee_id/.test(msg)) {
        const insertRow: any = { date: payload.date, start_time: payload.startTime, end_time: payload.endTime, role: payload.role ?? "Employee" };
        if (payload.company_id) insertRow.company_id = payload.company_id;
        if (payload.location) insertRow.location = payload.location;
        const retry = await supabase
          .from("shifts")
          .insert([insertRow])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }
    }
    if (error) throw error;
    let mapped = mapRow(data);
    // If client provided employees but DB schema doesn't store them on shifts,
    // try to persist assignments in `shift_assignments` and ensure returned shift
    // object contains `employees` and a usable `employeeName` to avoid UI crashes.
    if (Array.isArray(payload.employees) && payload.employees.length > 0) {
      try {
        await replaceAssignments(mapped.id, payload.employees);
      } catch (assignmentError) {
        const { error: cleanupError } = await supabase.from("shifts").delete().eq("id", mapped.id);
        if (cleanupError) {
          throw new Error(`Shift was created, but assignments could not be saved (${errorMessage(assignmentError)}). The shift cleanup also failed (${cleanupError.message}).`, { cause: assignmentError });
        }
        throw new Error(`Shift was not saved because assignments could not be saved: ${errorMessage(assignmentError)}`, { cause: assignmentError });
      }
      mapped = { ...mapped, employees: payload.employees, employeeName: payload.employeeName ?? payload.employees[0] };
    }
    // ensure local state contains it (realtime may also add it)
    setShifts((s) => (s.some((x) => x.id === mapped.id) ? s : [...s, mapped]));
    return mapped;
  };

  const updateShift = async (id: string, payload: Partial<Shift>) => {
    const { data: previousRow, error: readError } = await supabase
      .from("shifts")
      .select("*")
      .eq("id", id)
      .single();
    if (readError) throw readError;

    // build update object; include employee_id if available
    const upd: any = { date: payload.date, start_time: payload.startTime, end_time: payload.endTime };
    if (payload.employees) upd.employees = payload.employees;
    if (payload.employeeName) upd.employee_name = payload.employeeName;
    upd.role = payload.role ?? "Employee";
    // ensure company stays associated when updating
    if (!upd.company_id && (payload as any).company_id) upd.company_id = (payload as any).company_id;
    if (!upd.company_id && companyId) upd.company_id = companyId;
    if (payload.location) upd.location = payload.location;

    let { data, error } = await supabase.from("shifts").update(upd).eq("id", id).select().single();
    // if employees, employee_name or employee_id column missing, retry without them
    if (error && error.code === "PGRST204") {
      const msg = String(error.message || "");
      if (/employees/.test(msg) || /employee_name/.test(msg) || /employee_id/.test(msg)) {
        const updRow: any = { date: payload.date, start_time: payload.startTime, end_time: payload.endTime, role: payload.role ?? "Employee" };
        if ((payload as any).company_id) updRow.company_id = (payload as any).company_id;
        if ((payload as any).location) updRow.location = (payload as any).location;
        const retry = await supabase
          .from("shifts")
          .update(updRow)
          .eq("id", id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }
    }
    if (error) throw error;
    const originalRow = previousRow;
    let mapped = mapRow(data);
    // sync shift_assignments if employees provided in payload
    if (Array.isArray(payload.employees)) {
      try {
        await replaceAssignments(id, payload.employees);
      } catch (assignmentError) {
        const rollback: Record<string, unknown> = {};
        for (const [source, target] of [["date", "date"], ["start_time", "start_time"], ["end_time", "end_time"], ["role", "role"], ["location", "location"]]) {
          if (originalRow[source] !== undefined) rollback[target] = originalRow[source];
        }
        const { error: rollbackError } = await supabase.from("shifts").update(rollback).eq("id", id);
        if (rollbackError) {
          throw new Error(`Assignments could not be saved (${errorMessage(assignmentError)}), and the shift changes could not be reverted (${rollbackError.message}).`, { cause: assignmentError });
        }
        throw new Error(`Shift changes were reverted because assignments could not be saved: ${errorMessage(assignmentError)}`, { cause: assignmentError });
      }
      mapped = { ...mapped, employees: payload.employees, employeeName: payload.employeeName ?? (payload.employees.length > 0 ? payload.employees[0] : mapped.employeeName) };
    }
    setShifts((s) => s.map((sh) => (sh.id === mapped.id ? mapped : sh)));
    console.log("updateShift: UPDATED SHIFT", mapped);
    return mapped;
  };

  const deleteShift = async (id: string) => {
    const deletedShift = shifts.find((shift) => shift.id === id) ?? null;
    const { error } = await supabase.from("shifts").delete().eq("id", id);
    if (error) throw error;
    setShifts((s) => s.filter((sh) => sh.id !== id));
    return deletedShift;
  };

  return { shifts, loading, fetchShifts, createShift, updateShift, deleteShift };
}

export default useShifts;
