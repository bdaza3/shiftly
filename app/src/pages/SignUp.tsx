"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../../lib/supabaseClient";
import { LogIn, Chrome } from "lucide-react";

export function Signup() {
  const { signUp, userloading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    console.log('SignUp.handleSignUp: start', { email })
    try {
      const e = (email || '').trim().toLowerCase();
      // basic client-side email validation
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(e)) {
        setLoading(false);
        return;
      }
      console.log('SignUp.handleSignUp: calling signUp', { email: e })
      const res = await signUp(e, password);
      console.log('SignUp.handleSignUp: signUp response', res)
      setLoading(false);
      // handle v2 return shape { data, error } or legacy
      const err = (res && (res.error || res?.data?.error)) ?? null;
      if (err) {
        alert(err.message || String(err));
        return;
      }
      // Always send new signups to the registration flow so they complete their profile.
      alert("Account created. Continue registration to complete your profile.");
      // Supabase may take a short moment to update session; wait briefly before redirecting
      await new Promise((res) => setTimeout(res, 500));
      console.log('SignUp.handleSignUp: navigating to /register')
      router.push("/register");
    } catch (err: any) {
      console.error("signup error", err);
      alert(err?.message || String(err) || "Signup failed");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      console.log('SignUp.handleGoogle: starting oauth')
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/register` },
      });
      console.log('SignUp.handleGoogle: oauth triggered')
    } catch (err: any) {
      console.warn('SignUp.handleGoogle: error', err)
      alert(err.message || String(err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#4F46E5] mb-2">Create account</h1>
            <p className="text-gray-500">Sign up to manage your shifts</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                suppressHydrationWarning={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                suppressHydrationWarning={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <button onClick={handleSignUp} disabled={loading || userloading} type="button" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer">
              <LogIn className="w-5 h-5" />
              Create account
            </button>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <hr className="flex-1 border-gray-200" />
            </div>

            <button onClick={handleGoogle} type="button" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:cursor-pointer">
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="text-center text-sm text-gray-500">
              Already have an account? 
              <a href="/" className="text-[#4F46E5] hover:text-[#6366F1] font-medium">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}