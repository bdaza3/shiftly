"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function Team() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from("users").select("id, full_name, role, email");
      if (error) {
        console.warn("could not fetch users for Team", error);
        // fallback: empty
        if (mounted) {
          setMembers([]);
          setLoading(false);
        }
        return;
      }
      if (!mounted) return;
      setMembers((data || []).map((u: any) => ({ id: u.id, name: u.full_name ?? u.email ?? "Unknown", role: u.role, email: u.email })));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

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
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-medium">{(m.name || "?").charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{m.name}</p>
                    <p className="text-sm text-gray-500">{m.role ?? "Employee"} • {m.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Team;
