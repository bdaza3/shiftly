"use client";

import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";
import { useAuth } from "../../hooks/useAuth";
import { authFetch } from "@/lib/authFetch";
import { sanitizeEmail, sanitizeString } from "@/lib/inputSanitizer";

export function ManageEmployees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { selected, loading: companiesLoading } = useCompany();
  const { user } = useAuth();
  const selectedId = selected?.id;
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showJoinPopup, setShowJoinPopup] = useState(false);

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
      if (!selected) {
        setMessage("No company selected.");
        setLoading(false);
        return;
      }

      const resp = await authFetch('/api/company_members/add', {
        method: 'POST',
        body: JSON.stringify({
          company_id: selected.id,
          email: emailInput,
          first_name: firstNameInput || null,
          last_name: lastNameInput || null,
        }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to add employee');

      setMessage("Invitation sent.");
      setEmailInput("");
      setFirstNameInput("");
      setLastNameInput("");
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
      if (!selectedId) {
        if (mounted) {
          setEmployees([]);
          setLoading(false);
        }
        return;
      }
      setLoading(true);
      try {
        console.log('ManageEmployees: loading company_members via API', { companyId: selectedId });
        const resp = await authFetch('/api/company_members/list', {
          method: 'POST',
          body: JSON.stringify({ company_id: selectedId }),
          cache: 'no-store',
        });
        const json = await resp.json();
        console.log('ManageEmployees: server response', { status: resp.status, json });
        if (!resp.ok) throw new Error(json?.error || 'Failed to load company members');
        const nextEmployees = (json?.members || [])
          .map((member: any) => ({
            id: member.id,
            name: member.name ?? member.email ?? member.id,
            email: member.email ?? null,
            role: member.role ?? 'employee',
            position: 'Employee',
            startDate: member.startDate,
          }))
          .filter((employee: any) => employee.id !== user?.id);
        if (mounted) setEmployees(nextEmployees);
      } catch (err) {
        console.warn("could not load company members", err);
        if (mounted) setEmployees([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [selectedId, user?.id]);

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
      // If the CompanyProvider is still loading companies, wait for it instead
      if (companiesLoading) return
      // fallback: request companies for this user and find the selected company
      try {
        if (!user?.id) return
        const resp = await authFetch('/api/companies/mine', { method: 'POST', body: JSON.stringify({}) })
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
  }, [selectedId, user?.id, companiesLoading])

  const handleRemove = async (userId: string) => {
    if (!selected) return;
    try {
      const resp = await authFetch('/api/company_members/remove', {
        method: 'POST',
        body: JSON.stringify({ company_id: selected.id, user_id: userId }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || 'Failed to remove member');
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
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Employees</h2>
              <p className="text-sm text-gray-500 mt-1">View and manage employee information and roles</p>
            </div>
          </div>
            <div className="ml-4 flex items-center gap-4 relative">
              {joinCode ? (
                <div>
                  {/* Button to open popup next to Add Employee */}
                  <button
                    onClick={() => setShowJoinPopup(true)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors hover:cursor-pointer"
                    aria-expanded={showJoinPopup}
                  >
                    Display Join Code
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 rounded bg-gray-50 border border-gray-200 text-sm text-gray-500">Join code unavailable</div>
              )}

              {/* Popup + overlay */}
              {showJoinPopup && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowJoinPopup(false)} />
                  <div className="absolute z-50 right-0 top-full mt-2 w-64">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-semibold">Company Join Code</div>
                        <button onClick={() => setShowJoinPopup(false)} className="text-gray-400 hover:text-gray-600 hover:cursor-pointer">✕</button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono font-semibold text-lg">{joinCode ?? "N/A"}</div>
                        <button
                          onClick={() => {
                            if (!joinCode) return;
                            navigator.clipboard?.writeText(joinCode).then(() => console.log("copied")).catch(() => {});
                            setCodeCopied(true);
                            setTimeout(() => setCodeCopied(false), 3000);
                          }}
                          className={`px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors ${codeCopied ? "bg-green-600 hover:bg-green-700" : "hover:cursor-pointer"}`}
                        >
                          {codeCopied ? <span className="text-white text-xs">Copied!</span> : <span className="text-white text-xs">Copy</span>}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Share this code with employees to join the company.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:cursor-pointer">
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* currently, employee invites do not work, and are only available for existing users via signed up emails */}
        {employees.length === 0 ? (
          <div className="col-span-full text-gray-500">No employees added yet. Use "Add Employee" to invite a user.</div>
        ) : (
          employees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-medium">{(employee.name || "?").charAt(0)}</div>
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
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors hover:cursor-pointer"><Pencil className="w-4 h-4" />Edit</button>
                <button onClick={() => handleRemove(employee.id)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors hover:cursor-pointer"><Trash2 className="w-4 h-4" />Remove</button>
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
            <h3 className="text-lg font-semibold mb-4">Invite Employee by Email</h3>
            <p className="text-sm text-gray-500 mb-3">Send a one-time invitation link. The recipient can use it to join this company after signing in or creating an account.</p>
            <input type="email" value={emailInput} onChange={(e) => setEmailInput(sanitizeEmail(e.target.value))} placeholder="user@example.com" className="w-full border p-2 rounded mb-3" />
            <input type="text" value={firstNameInput} onChange={(e) => setFirstNameInput(sanitizeString(e.target.value, 80))} placeholder="First name (optional)" className="w-full border p-2 rounded mb-3" />
            <input type="text" value={lastNameInput} onChange={(e) => setLastNameInput(sanitizeString(e.target.value, 80))} placeholder="Last name (optional)" className="w-full border p-2 rounded mb-3" />
            {message && <p className="text-sm text-red-500 mb-3">{message}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 rounded border hover:bg-gray-100 transition-colors hover:cursor-pointer">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  console.log('Add button clicked');
                  setMessage('Preparing to add...');
                  handleAddByEmail();
                }}
                disabled={loading}
                className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors hover:cursor-pointer"
              >Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageEmployees;
