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

export function useShifts() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("shifts").select("*").order("date", { ascending: true });
    if (error) {
      console.error("useShifts fetch", error);
      setShifts([]);
    } else {
      setShifts((data || []).map(mapRow));
    }
    setLoading(false);
  }, []);

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
  }, [fetchShifts]);

  const createShift = async (payload: Partial<Shift>) => {
    // build row payload; include employee_id if we have at least one employee selected
    const row: any = {
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      role: payload.role ?? "Employee",
    };
    if (payload.employees) row.employees = payload.employees;
    if (payload.location) row.location = payload.location;
    const isUUID = (v: any) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    if (payload.employeeId && isUUID(payload.employeeId)) row.employee_id = payload.employeeId;
    else if (payload.employees && payload.employees.length > 0 && isUUID(payload.employees[0])) row.employee_id = payload.employees[0];
    // include employee_name if provided (some schemas require it)
    if (payload.employeeName) row.employee_name = payload.employeeName;

    // verify employee_id refers to an existing user to avoid foreign key violations
    if (row.employee_id) {
      try {
        const { data: userExists, error: uErr } = await supabase.from("users").select("id").eq("id", row.employee_id).maybeSingle();
        if (uErr) {
          console.warn("could not verify user existence for employee_id", uErr);
        }
        // if not found, remove employee_id to avoid FK constraint; leave employee_name if present
        if (!userExists) {
          console.warn("employee_id not found in users table, removing employee_id to avoid FK error", row.employee_id);
          delete row.employee_id;
        }
      } catch (err) {
        console.warn("error verifying employee_id", err);
      }
    }

    let { data, error } = await supabase.from("shifts").insert([row]).select().single();
    // handle case where DB doesn't have employees column yet
    if (error && error.code === "PGRST204" && /employees/.test(String(error.message))) {
      const retry = await supabase
        .from("shifts")
        .insert([
          { date: payload.date, start_time: payload.startTime, end_time: payload.endTime },
        ])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    const mapped = mapRow(data);
    // ensure local state contains it (realtime may also add it)
    setShifts((s) => (s.some((x) => x.id === mapped.id) ? s : [...s, mapped]));
    return mapped;
  };

  const updateShift = async (id: string, payload: Partial<Shift>) => {
    // build update object; include employee_id if available
    const upd: any = { date: payload.date, start_time: payload.startTime, end_time: payload.endTime };
    if (payload.employees) upd.employees = payload.employees;
    const isUUID2 = (v: any) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    if (payload.employeeId && isUUID2(payload.employeeId)) upd.employee_id = payload.employeeId;
    else if (payload.employees && payload.employees.length > 0 && isUUID2(payload.employees[0])) upd.employee_id = payload.employees[0];
    if (payload.employeeName) upd.employee_name = payload.employeeName;
    upd.role = payload.role ?? "Employee";
    if (payload.location) upd.location = payload.location;

    // verify employee exists before updating to avoid FK violation
    if (upd.employee_id) {
      try {
        const { data: userExists, error: uErr } = await supabase.from("users").select("id").eq("id", upd.employee_id).maybeSingle();
        if (uErr) console.warn("could not verify user existence for employee_id (update)", uErr);
        if (!userExists) {
          console.warn("employee_id not found for update, removing employee_id to avoid FK error", upd.employee_id);
          delete upd.employee_id;
        }
      } catch (err) {
        console.warn("error verifying employee_id (update)", err);
      }
    }

    let { data, error } = await supabase.from("shifts").update(upd).eq("id", id).select().single();
    // if employees column missing, retry without it
    if (error && error.code === "PGRST204" && /employees/.test(String(error.message))) {
      const retry = await supabase
        .from("shifts")
        .update({ date: payload.date, start_time: payload.startTime, end_time: payload.endTime })
        .eq("id", id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }
    if (error) throw error;
    const mapped = mapRow(data);
    setShifts((s) => s.map((sh) => (sh.id === mapped.id ? mapped : sh)));
    console.log("updateShift: UPDATED SHIFT", mapped);
    return mapped;
  };

  const deleteShift = async (id: string) => {
    const { error } = await supabase.from("shifts").delete().eq("id", id);
    if (error) throw error;
    setShifts((s) => s.filter((sh) => sh.id !== id));
    return true;
  };

  return { shifts, loading, fetchShifts, createShift, updateShift, deleteShift };
}

export default useShifts;