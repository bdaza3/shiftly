"use client";

import React from "react";
import { useCompany } from "../contexts/CompanyContext";

export function Company() {
  const { selected } = useCompany();

  if (!selected) return <div>No company selected</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-2">Company</h2>
        <p className="text-lg font-medium">{selected.name}</p>
        {selected.owner && <p className="text-sm text-gray-500">Owner: {selected.owner}</p>}
        {selected.address && <p className="text-sm text-gray-500">Address: {selected.address}</p>}
        {selected.website && (
          <p className="text-sm text-gray-500">Website: <a className="text-blue-600" href={selected.website}>{selected.website}</a></p>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-medium">Teams</h3>
          <ul className="mt-2 space-y-2">
            {selected.teams?.map((t) => (
              <li key={t.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm text-gray-500">Manager: {t.manager}</div>
                  </div>
                  <div className="text-sm text-gray-500">Members: {t.members}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
