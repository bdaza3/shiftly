import React from "react";
import Link from "next/link";

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Link href="/notifications" className="text-sm text-indigo-600 hover:underline">Notifications</Link>
      </div>

      <div className="mt-6 space-y-6">
        <section className="bg-white border rounded p-4">
          <h2 className="text-lg font-medium">Account</h2>
          <p className="text-sm text-gray-600 mt-2">Update your account information and preferences.</p>
        </section>

        <section className="bg-white border rounded p-4">
          <h2 className="text-lg font-medium">Billing</h2>
          <p className="text-sm text-gray-600 mt-2">Manage billing details and subscriptions.</p>
        </section>
      </div>
    </div>
  );
}