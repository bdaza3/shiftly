"use client";

import React, { startTransition, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Users, ArrowRight as ArrowRightIcon } from "lucide-react";
import Step2RoleSelection from "./Step2RoleSelection";
import JoinCompany from "./JoinCompany";
import CreateCompany from "./CreateCompany";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../../../lib/supabaseClient";
import { authFetch } from "@/lib/authFetch";
import { sanitizeString, sanitizePhone } from "@/lib/inputSanitizer";

export function Register() {
  const { user, refreshProfile, syncLocalAuth, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams?.get("step") ?? "1";
  const sub = searchParams?.get("sub");
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
          const resp = await authFetch('/api/profiles/upsert', {
            method: 'POST',
            body: JSON.stringify({ first_name: firstName ?? null, last_name: lastName ?? null, phone: phone ?? null })
          })
          const json = await resp.json()
          if (!resp.ok) console.warn('server profiles upsert failed', json)
        }
      } catch (upsertErr) {
        console.error('profiles upsert failed', upsertErr);
      }

      syncLocalAuth({
        profile: {
          ...(user ? { id: user.id } : {}),
          first_name: firstName,
          last_name: lastName,
          phone,
        },
        userMetadata: {
          firstName,
          lastName,
          phone,
        },
      })

      console.log('HANDLE SUBMIT: registration successful, navigating to company setup')
      startTransition(() => {
        router.replace("/register?step=2&sub=create-company");
        router.refresh();
      })
      refreshProfile().catch((e) => {
        console.warn('Register: background refreshProfile failed', e);
      })
    } catch (err: any) {
      console.error('Register: submission failed', err);
      const text = err?.message || String(err)
      setMessage(text)
      alert(text);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = (e?: React.FormEvent) => {
    e?.preventDefault();
    const payload = { firstName, lastName, phone };
    try {
      sessionStorage.setItem("registration_step1", JSON.stringify(payload));
    } catch (err) {
      console.warn("failed to save registration_step1", err);
    }
    // navigate to step 2 (adapted for this Next.js app using query param)
    router.push("/register?step=2");
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
  // Sub-views: join/create company under register
  if (sub === "join-company") {
    return <JoinCompany />;
  }

  if (sub === "create-company") {
    return <CreateCompany />;
  }

  // Step 2: role selection UI
  if (step === "2") {
    return <Step2RoleSelection />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Shiftly</h1>
            <p className="text-gray-500">Let's get started!</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
                <span className="ml-2 text-sm font-medium text-gray-900">Basic Info</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300 mx-2"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-medium">2</div>
                <span className="ml-2 text-sm text-gray-500">Account Setup</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleContinue} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First name
                <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last name
                <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
              </label>              
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone number
                <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
              </label>              
              <input
                type="tel"
                id="phoneNumber"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">We'll use this for shift reminders and notifications</p>
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:cursor-pointer font-medium">
              Continue
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Already have an account? Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
