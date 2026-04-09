"use client";

import React, { useState } from "react";

export function Notifications() {
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      <div className="mt-6 space-y-4">
        <div className="bg-white border rounded p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">Email notifications</div>
            <div className="text-sm text-gray-600">Receive notifications by email.</div>
          </div>
          <label className="inline-flex items-center">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600" />
          </label>
        </div>

        <div className="bg-white border rounded p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">Browser push notifications</div>
            <div className="text-sm text-gray-600">Allow push notifications in your browser.</div>
          </div>
          <label className="inline-flex items-center">
            <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600" />
          </label>
        </div>
      </div>
    </div>
  );
}