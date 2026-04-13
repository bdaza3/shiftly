"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";
import { sanitizeEmail, sanitizeString } from "@/lib/inputSanitizer";

export default function CreateSampleUser() {
  const router = useRouter();
  const { selected } = useCompany();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("employee");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selected) {
      setMessage("Select a company first.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // Only send `id` if the admin explicitly provided one. Otherwise let the server create the auth user and profile using `email`.
      const explicitId = userId?.trim() || undefined;

      const payload: any = { email, first_name: firstName, last_name: lastName, role, company_id: selected.id };
      if (explicitId) payload.id = explicitId;

      const res = await fetch('/api/admin/create-sample-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'server error');

      setMessage('Profile and membership created.');
      router.push('/admin/manageemployees');
    } catch (err: any) {
      console.error("create sample user failed", err);
      setMessage(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create Sample User</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input value={email} onChange={(e) => setEmail(sanitizeEmail(e.target.value))} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First name</label>
            <input value={firstName} onChange={(e) => setFirstName(sanitizeString(e.target.value, 80))} className="mt-2 block w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last name</label>
            <input value={lastName} onChange={(e) => setLastName(sanitizeString(e.target.value, 80))} className="mt-2 block w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="company">Company</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Optional user id (paste auth user id to link)</label>
          <input value={userId} onChange={(e) => setUserId(sanitizeString(e.target.value, 64))} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>
        {message && <p className="text-sm text-red-500">{message}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push('/admin/manageemployees')} className="px-4 py-2 border rounded">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Create & Add</button>
        </div>
      </form>
    </div>
  );
}
