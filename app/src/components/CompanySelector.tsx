"use client";

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useCompany } from "../contexts/CompanyContext";

export default function CompanySelector({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { companies, selectCompany, addCompany } = useCompany();
  const [newName, setNewName] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-10 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Select Company</h2>
          <button onClick={onClose} className="text-sm text-gray-500">Close</button>
        </div>

        <div className="mt-4 space-y-2 max-h-48 overflow-auto">
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                selectCompany(c.id);
                onClose();
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
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
              onClick={() => {
                const name = newName.trim();
                if (!name) return;
                const id = `c${Date.now()}`;
                addCompany({ id, name });
                setNewName("");
                onClose();
              }}
              className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
