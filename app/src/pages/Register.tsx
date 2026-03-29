"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

export function Register() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    // prefill from metadata when available
    setFirstName(user.user_metadata?.firstName ?? "");
    setLastName(user.user_metadata?.lastName ?? "");
    setPhone(user.user_metadata?.phone ?? "");
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      console.log('Register: submit', { firstName, lastName, phone })
      // update user metadata with name/phone (no role)
      const newMeta: any = {
        firstName,
        lastName,
        phone,
      };

      const res = await supabase.auth.updateUser({ data: newMeta });
      // supabase v2 returns { data, error }
      const err = (res as any)?.error ?? null
      if (err) {
        console.warn('Register: updateUser error', err)
        throw err
      }


      // Upsert into profiles table via server API (service role) to avoid RLS
      try {
        if (user?.id) {
          const resp = await fetch('/api/profiles/upsert', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ id: user.id, first_name: firstName ?? null, last_name: lastName ?? null, phone: phone ?? null })
          })
          const json = await resp.json()
          if (!resp.ok) console.warn('server profiles upsert failed', json)
        }
      } catch (upsertErr) {
        console.error('profiles upsert failed', upsertErr);
      }

      // Move to company onboarding step
      console.log('Register: profile upsert complete, redirecting to onboarding/company')
      router.push("/onboarding/company");
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-gray-600">You must be signed in to complete registration.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Complete your registration</h1>
      <p className="text-sm text-gray-600 mt-1">Fill in the details to finish setting up your account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First name</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>

        <div className="flex items-center gap-2">
          <button disabled={loading} type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
            Save and continue
          </button>
          <button type="button" onClick={() => router.push('/dashboard')} className="px-4 py-2 border rounded">
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}
