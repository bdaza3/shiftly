"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCompany } from "../hooks/useCompany";
import { useCompanyMembers } from "../hooks/useCompanyMembers";
import { useAuth } from "../hooks/useAuth";

export function Team() {
  const { selected } = useCompany();
  const { members, loading } = useCompanyMembers(selected?.id ?? null);
  const { user } = useAuth();
  //const [members, setMembers] = useState<{ id: string; name: string; role: string; email?: string; full_name?: string; first_name?: string; last_name?: string; user_id?: string }[]>([])
  //const [loading, setLoading] = useState(false)


  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team</h2>
          <p className="text-sm text-gray-500 mt-1">Directory of employees</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500">No team members found.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const fullName =
                m.full_name ||
                (m.first_name || m.last_name ? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() : null) ||
                m.name ||
                m.email ||
                m.id ||
                m.user_id ||
                "Unknown";
              return (
                <div key={m.id ?? fullName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">{(fullName || "?").charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{fullName}</p>
                      <p className="text-sm text-gray-500">{m.role ?? "Employee"}{m.email ? ` • ${m.email}` : ""}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Team;
