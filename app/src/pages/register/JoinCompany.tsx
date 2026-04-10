"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Hash, CheckCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function JoinCompany() {
	const [joinCode, setJoinCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [companyPreview, setCompanyPreview] = useState<{
		name: string;
		industry?: string;
	} | null>(null);
	const router = useRouter();
	const { user, refreshProfile } = useAuth();

	useEffect(() => {
		const step1Data = sessionStorage.getItem("registration_step1");
		if (!step1Data) {
			router.push("/register?step=1");
		}
	}, [router]);

	const handleCodeChange = (value: string) => {
		const v = value.toUpperCase();
		setJoinCode(v);

		// Mock preview when 6 chars entered
		if (v.length === 6) {
			setTimeout(() => {
				setCompanyPreview({ name: "Joe's Pizza 🍕", industry: "Restaurant" });
			}, 300);
		} else {
			setCompanyPreview(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			const step1Data = JSON.parse(sessionStorage.getItem("registration_step1") || "{}");

			if (!user?.id) throw new Error("Not signed in");

			const resp = await fetch("/api/companies/join", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ join_code: joinCode, user_id: user.id }),
			});

			const json = await resp.json();
			if (!resp.ok || json?.error) {
				throw new Error(json?.error || "Failed to join company");
			}

			// clear step1 data
			sessionStorage.removeItem("registration_step1");

			// refresh local profile/state
			try {
				await refreshProfile();
			} catch (err) {
				// ignore
			}

			router.replace("/");
		} catch (error: any) {
			alert(error?.message || String(error) || "Invalid join code. Please check and try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
				<div className="p-8">
					<div className="text-center mb-8">
						<div className="w-16 h-16 rounded-full bg-[#4F46E5] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
							<Building2 className="w-8 h-8 text-[#4F46E5]" />
						</div>
						<h1 className="text-3xl font-bold text-[#4F46E5] mb-2">Join Your Company</h1>
						<p className="text-gray-500">Enter the invite code from your manager</p>
					</div>

					<div className="mb-8">
						<div className="flex items-center justify-center gap-2">
							<div className="flex items-center">
								<div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-medium">
									✓
								</div>
							</div>
							<div className="w-12 h-0.5 bg-[#10B981] mx-2"></div>
							<div className="flex items-center">
								<div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-medium">
									✓
								</div>
							</div>
							<div className="w-12 h-0.5 bg-[#4F46E5] mx-2"></div>
							<div className="flex items-center">
								<div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-sm font-medium">3</div>
							</div>
						</div>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
								Company Join Code
							</label>
							<div className="relative">
								<Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
								<input
									type="text"
									id="joinCode"
									value={joinCode}
									onChange={(e) => handleCodeChange(e.target.value)}
									required
									placeholder="ABC123"
									maxLength={6}
									className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent uppercase tracking-wider text-center text-lg font-mono"
								/>
							</div>
							<p className="mt-1 text-xs text-gray-500">Ask your manager for the 6-character join code</p>
						</div>

						{companyPreview && (
							<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
								<div className="flex items-start gap-3">
									<CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="text-sm font-medium text-green-900">You're joining:</p>
										<p className="text-lg font-semibold text-green-900 mt-1">{companyPreview.name}</p>
										{companyPreview.industry && <p className="text-sm text-green-700 mt-0.5">{companyPreview.industry}</p>}
									</div>
								</div>
							</div>
						)}

						<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<p className="text-sm text-blue-900 font-medium mb-2">Don't have a join code?</p>
							<p className="text-sm text-blue-700">Contact your manager or company owner to get an invite code. They can generate one from their admin dashboard.</p>
						</div>

						<div className="flex gap-3 pt-4">
							<button
								type="button"
								onClick={() => router.push("/register?step=2")}
								className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
							>
								Back
							</button>
							<button
								type="submit"
								disabled={loading || joinCode.length < 6}
								className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
							>
								{loading ? (
									"Joining..."
								) : (
									<>
										Join Company
										<ArrowRight className="w-5 h-5" />
									</>
								)}
							</button>
						</div>
					</form>

					<div className="mt-6 pt-6 border-t border-gray-200">
						<p className="text-center text-sm text-gray-600 mb-3">Or join using:</p>
						<div className="flex gap-3">
							<button type="button" className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
								📧 Email Invite
							</button>
							<button type="button" className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
								📱 QR Code
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

