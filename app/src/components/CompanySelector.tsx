"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useCompany } from "../hooks/useCompany";
import { useAuth } from "../hooks/useAuth";

export default function CompanySelector({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { companies, selectCompany, addCompany } = useCompany();
  const [newName, setNewName] = useState("");
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Select Company</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:bg-gray-200 hover:cursor-pointer">Close</button>
        </div>

        <div className="mt-4 space-y-2 max-h-48 overflow-auto">
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                selectCompany(c.id);
                onClose();
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 hover:cursor-pointer"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">{c.address}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 border-t pt-4">
          <label className="text-sm text-gray-600">Create new company</label>
          <div className="flex gap-2 mt-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Company name"
            />
            <button
              onClick={async () => {
                const name = newName.trim();
                if (!name) return;
                setError(null);
                setCreating(true);
                try {
                  const join_code = generateJoinCode();
                  const resp = await fetch('/api/companies/create', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ name, user_id: user?.id, join_code })
                  });
                  const json = await resp.json();
                  if (!resp.ok) {
                    const msg = json?.error || 'failed creating company';
                    setError(msg);
                    setCreating(false);
                    return;
                  }
                  const created = json.company;
                  if (created) addCompany(created);
                  setNewName("");
                  onClose();
                } catch (e: any) {
                  setError(e?.message || String(e));
                } finally {
                  setCreating(false);
                }
              }}
              disabled={creating}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
