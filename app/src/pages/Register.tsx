"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../../../lib/supabaseClient";

export function Register() {
  const { user, refreshProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    console.log('Register: useEffect user change', { user })
    if (!user) return;
    // prefill from metadata when available
    setFirstName(user.user_metadata?.firstName ?? "");
    setLastName(user.user_metadata?.lastName ?? "");
    setPhone(user.user_metadata?.phone ?? "");
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    console.log('HANDLE SUBMIT: SUBMITTING INFO', { firstName, lastName, phone, userId: user?.id })
    setLoading(true); 
    try {
      console.log('HANDLE SUBMIT: Trying to register: submit', { firstName, lastName, phone })
      const newMeta: any = {
        firstName,
        lastName,
        phone,
      };

      console.log('HANDLE SUBMIT: calling supabase.auth.updateUser')
        let updateError = null;

        try {
        const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("updateUser timeout")), 5000)
        );

        await Promise.race([
        supabase.auth.updateUser({ data: newMeta }),
        timeout
        ]);
        console.log('HANDLE SUBMIT: updateUser completed')
        } catch (e) {
        console.warn('updateUser timeout', e);
        updateError = e;
        }

        // don't block the flow unless it's critical
        if (updateError) {
        console.warn('updateUser error (continuing anyway):', updateError);
        }

      console.log('HANDLE SUBMIT: updateUser successful, now upserting profile via API')
      // Upsert into profiles table via server API (service role) to avoid RLS
      try {
        if (user?.id) {
        console .log('HANDLE SUBMIT: upserting profile via API', { userId: user.id, firstName, lastName, phone })
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

      console.log('HANDLE SUBMIT: registration successful, navigating to onboarding')
        router.replace("/onboardingcompany");

        console.log('HANDLE SUBMIT: refreshing profile to sync state')

      // Refresh profile so UI (sidebar/profile) reflects saved data
        refreshProfile().catch((e) => {
        console.warn('Register: refreshProfile failed', e);
        });      
    } catch (err: any) {
      console.error('Register: submission failed', err);
      const text = err?.message || String(err)
      setMessage(text)
      alert(text);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    )
  }

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
          <label className="block text-sm font-medium text-gray-700">First name
            <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
          </label>
          <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last name
            <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
          </label>
          <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone
            <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
          </label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
        </div>

        <div className="flex items-center gap-2">
          <button disabled={loading} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 hover:cursor-pointer">
            Save and continue
          </button>
          <button type="button" onClick={() => { console.log('Register: skip -> onboarding'); router.replace('/onboardingcompany') }} className="px-4 py-2 border rounded hover:bg-gray-100 hover:cursor-pointer">
            Skip
          </button>
        </div>
        {message && <div className="mt-2 text-sm text-red-600">{message}</div>}
      </form>
    </div>
  );
}
