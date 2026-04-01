"use client";

import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCompany } from "../../contexts/CompanyContext";
import { useAuth } from "../../contexts/AuthContext";

export function ManageEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { selected } = useCompany();
  const { user } = useAuth();
  const [joinCode, setJoinCode] = useState<string | null>(null);

  const openAdd = () => {
    setEmailInput("");
    setMessage(null);
    setShowModal(true);
  };

  const handleAddByEmail = async () => {
    console.debug('handleAddByEmail start', { emailInput, firstNameInput, lastNameInput, selected });
    if (!emailInput || emailInput.trim() === '') {
      setMessage('Enter an email address.');
      return;
    }
    setLoading(true);
    setMessage('Adding...');
    try {
      // find user in auth 'users' view (may require appropriate RLS/permissions)
      let userRow: any = null;
      const { data: urow, error: uErr } = await supabase.from("users").select("id, full_name, email, role").eq("email", emailInput).maybeSingle();
      if (uErr) {
        console.warn("could not query users view", uErr);
      }

      if (!selected) {
        setMessage("No company selected.");
        setLoading(false);
        return;
      }

      // persist membership
      const { data: insertRes, error: insertErr } = await supabase.from("company_members").insert([{ company_id: selected.id, user_id: userRow.id, role: userRow.role ?? "employee" }]);
      if (insertErr) throw insertErr;

      const newEmp = {
        id: userRow.id,
        name: userRow.full_name ?? userRow.email,
        email: userRow.email,
        role: userRow.role ?? "employee",
        position: "Employee",
        startDate: new Date().toISOString().split("T")[0],
      };
      setEmployees((s) => [newEmp, ...s]);
      setMessage("Employee added to company.");
      setEmailInput("");
      setShowModal(false);
    } catch (err: any) {
      console.error("add employee error", err);
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // load persisted members for selected company
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!selected) return;
      setLoading(true);
      try {
        const { data: rows, error } = await supabase.from("company_members").select("*").eq("company_id", selected.id).order("created_at", { ascending: false });
        console.log('ManageEmployees: company_members client query', { companyId: selected.id, rowsLength: (rows||[]).length, error })
        if (error) throw error;
        const out: any[] = [];
        for (const r of rows || []) {
          let info: any = null;
          try {
            const { data: p } = await supabase.from("profiles").select("id, first_name, last_name").eq("id", r.user_id).maybeSingle();
            if (p) info = { id: p.id, full_name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() };
          } catch (e) {
            // ignore
          }
          if (!info) {
            try {
              const { data: u } = await supabase.from("users").select("id, full_name, email, role").eq("id", r.user_id).maybeSingle();
              if (u) info = u;
            } catch (e) {
              // ignore
            }
          }
          out.push({ id: r.user_id, name: info?.full_name ?? info?.email ?? r.user_id, email: info?.email ?? null, role: r.role ?? "employee", startDate: r.created_at });
        }
        if (mounted) setEmployees(out);
        // if client read returned no members, try server fallback
        if ((out || []).length === 0) {
          try {
            console.log('ManageEmployees: client returned 0 members, trying server fallback')
            const resp = await fetch('/api/company_members/list', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ company_id: selected.id }) })
            const json = await resp.json()
            console.log('ManageEmployees: server fallback response', json)
            if (resp.ok && json?.members) {
              if (mounted) setEmployees(json.members.map((m:any) => ({ id: m.id, name: m.name, email: m.email, role: m.role ?? 'employee', startDate: m.startDate })))
            }
          } catch (e) { console.warn('ManageEmployees: server fallback failed', e) }
        }
      } catch (err) {
        console.warn("could not load company members", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [selected]);

  // load join code for selected company (use client data or server fallback)
  useEffect(() => {
    let mounted = true
    const loadJoin = async () => {
      if (!selected) {
        if (mounted) setJoinCode(null)
        return
      }
      if ((selected as any).join_code) {
        if (mounted) setJoinCode((selected as any).join_code)
        return
      }
      // fallback: request companies for this user and find the selected company
      try {
        if (!user?.id) return
        const resp = await fetch('/api/companies/mine', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user_id: user.id }) })
        if (!resp.ok) return
        const json = await resp.json()
        const comps = json?.companies || []
        const found = comps.find((c: any) => c.id === selected.id)
        if (found && mounted) setJoinCode(found.join_code ?? null)
      } catch (e) {
        console.warn('ManageEmployees: could not load join code', e)
      }
    }
    loadJoin()
    return () => { mounted = false }
  }, [selected?.id, user?.id])

  const handleRemove = async (userId: string) => {
    if (!selected) return;
    try {
      const { error } = await supabase.from("company_members").delete().match({ company_id: selected.id, user_id: userId });
      if (error) throw error;
      setEmployees((s) => s.filter((e) => e.id !== userId));
    } catch (err) {
      console.warn("could not remove member", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="w-6 h-6 text-[#4F46E5]" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Employees</h2>
              <p className="text-sm text-gray-500 mt-1">View and manage employee information and roles</p>
            </div>
          </div>
            <div className="ml-4 flex items-center gap-4">
              {joinCode ? (
                <div className="px-3 py-2 rounded bg-gray-50 border border-gray-200 text-sm">
                  <div className="text-xs text-gray-500">Join Code</div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono font-semibold">{joinCode}</div>
                    <button onClick={() => { navigator.clipboard?.writeText(joinCode).then(()=>console.log('copied')).catch(()=>{}) }} className="text-xs text-blue-600 hover:underline">Copy</button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 rounded bg-gray-50 border border-gray-200 text-sm text-gray-500">Join code unavailable</div>
              )}
            </div>

          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors">
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.length === 0 ? (
          <div className="col-span-full text-gray-500">No employees added yet. Use "Add Employee" to include a user from Supabase.</div>
        ) : (
          employees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-lg font-medium">{(employee.name || "?").charAt(0)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-500">{employee.position}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${employee.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>{employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}</span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">{employee.email}</p>
                {employee.phone && (<p className="text-sm text-gray-600">{employee.phone}</p>)}
                <p className="text-sm text-gray-500">Started: {new Date(employee.startDate).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"><Pencil className="w-4 h-4" />Edit</button>
                <button onClick={() => handleRemove(employee.id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" />Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-50">
            <h3 className="text-lg font-semibold mb-4">Add Employee by Email</h3>
            <p className="text-sm text-gray-500 mb-3">Enter the email address of the existing Supabase user you want to add to Shiftly HQ.</p>
            <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="user@example.com" className="w-full border p-2 rounded mb-3" />
            <input type="text" value={firstNameInput} onChange={(e) => setFirstNameInput(e.target.value)} placeholder="First name (optional)" className="w-full border p-2 rounded mb-3" />
            <input type="text" value={lastNameInput} onChange={(e) => setLastNameInput(e.target.value)} placeholder="Last name (optional)" className="w-full border p-2 rounded mb-3" />
            {message && <p className="text-sm text-red-500 mb-3">{message}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 rounded border">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  console.log('Add button clicked');
                  setMessage('Preparing to add...');
                  handleAddByEmail();
                }}
                disabled={loading}
                className="px-3 py-2 rounded bg-[#4F46E5] text-white"
              >Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageEmployees;
