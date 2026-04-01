"use client";

import { useState, useEffect } from "react";
import CreateShiftModal from "../../components/CreateShiftModal";
import { useShifts } from "../../hooks/useShifts";
import { ClipboardList, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function ManageShifts() {
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const {shifts, loading, createShift, updateShift, deleteShift } = useShifts();

  const [employees, setEmployees] = useState<{ id: string; name: string; role?: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('ManageShifts: loading employees (raw users)')
      try {
        const { data, error } = await supabase.from("users").select("id, full_name, role, email");
        console.log('ManageShifts: users query result', { dataLength: (data || []).length, error })
        if (error) {
          console.warn("could not fetch users for ManageShifts", error);
          return;
        }
        if (!mounted) return;
        const mapped = (data || []).map((u: any) => ({ id: u.id, name: u.full_name ?? u.name ?? u.email ?? "Unknown", role: u.role }));
        console.log('ManageShifts: resolved employees', mapped.map(m => ({ id: m.id, name: m.name, role: m.role })))
        setEmployees(mapped);
      } catch (e) {
        console.warn('ManageShifts: users lookup failed', e)
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleOpenNew = () => {
    setEditingShift(null);
    setShowModal(true);
  };

  const handleSave = async (payload: any) => {
    try {
      if (payload.id) await updateShift(payload.id, payload);
      else await createShift(payload);
    } catch (err) {
      console.error("manage shifts save", err);
    }
    setShowModal(false);
    setEditingShift(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteShift(id);
    } catch (err) {
      console.error("manage shifts delete", err);
    }
    setShowModal(false);
    setEditingShift(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ClipboardList className="w-6 h-6 text-[#4F46E5]" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Shifts</h2>
              <p className="text-sm text-gray-500 mt-1">Create, edit, and delete employee shifts</p>
            </div>
          </div>

          <button onClick={handleOpenNew} className="flex items-center gap-2 px-4 py-2 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors">
            <Plus className="w-5 h-5" />
            New Shift
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-700">Employee</th>
                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 font-semibold text-gray-700">Time</th>
                <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                <th className="text-left p-4 font-semibold text-gray-700">Location</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : shifts).map((shift: any) => (
                <tr key={shift.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium">{((shift.employeeName ?? (shift.employees && shift.employees[0]) ?? "—").charAt(0))}</div>
                      <span className="font-medium text-gray-900">{shift.employeeName ?? (shift.employees && shift.employees[0]) ?? "—"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">{shift.date ? new Date(shift.date).toLocaleDateString() : "—"}</td>
                  <td className="p-4 text-gray-700">{shift.startTime ?? "--:--"} - {shift.endTime ?? "--:--"}</td>
                  <td className="p-4 text-gray-700">{shift.role ?? "-"}</td>
                  <td className="p-4 text-gray-700">{shift.location ?? "-"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${ (shift.status ?? "scheduled") === "scheduled" ? "bg-green-100 text-green-700" : (shift.status ?? "scheduled") === "completed" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700" }`}>{shift.status ?? "scheduled"}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingShift(shift); setShowModal(true); }} className="p-2 text-[#4F46E5] hover:bg-[#4F46E5] hover:bg-opacity-10 rounded transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(shift.id)} className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateShiftModal
        visible={showModal}
        onClose={() => { setShowModal(false); setEditingShift(null); }}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={editingShift}
        employees={employees.length > 0 ? employees : []}
      />
    </div>
  );
}