"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import React from "react";

export function Login() {
  const { signIn } = useAuth()
  const router = useRouter();
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")


  const handleSignIn = async () => {
    const res = await signIn(email, password)
    if (res.error) {
      alert(res.error.message)
    } else {
      // force a full reload so server-rendered pages pick up the new session
      try {
        window.location.assign('/dashboard')
      } catch (e) {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#4F46E5] mb-2">Shiftly</h1>
            <p className="text-gray-500">Sign in to manage your shifts</p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                suppressHydrationWarning={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                suppressHydrationWarning={true}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <button onClick={handleSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link href="/signup" className="text-sm text-[#4F46E5] hover:text-[#6366F1] font-medium">
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
