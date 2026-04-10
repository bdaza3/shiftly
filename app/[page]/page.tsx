import { notFound } from "next/navigation";
import React from "react";

import { Login } from "../src/pages/Login";
import { Signup } from "../src/pages/SignUp";
import { Register } from "../src/pages/register/Register";
import { Dashboard } from "../src/pages/Dashboard";
import Settings from "../src/pages/Settings";
import { Notifications } from "../src/pages/Notifications";
import { Company } from "../src/pages/Company";
import { Schedule } from "../src/pages/Schedule";
import { Team } from "../src/pages/Team";
import { Requests } from "../src/pages/Requests";
import { Profile } from "../src/pages/Profile";
import { ManageEmployees } from "../src/pages/admin/ManageEmployees";
import { ManageShifts } from "../src/pages/admin/ManageShifts";
import { Overview } from "../src/pages/admin/Overview";
import OnboardingCompany from "../src/pages/register/OnboardingCompany";
import JoinCompany from "../src/pages/register/JoinCompany";
import Step2RoleSelection from "../src/pages/register/Step2RoleSelection";

// Map of page names to components - add new pages here
const PAGES: Record<string, React.ComponentType<any>> = {
  // auth
  login: Login,
  signup: Signup,
  register: Register,
  step2roleselection: Step2RoleSelection,
  onboardingcompany: OnboardingCompany,
  joincompany: JoinCompany,
  
  // main
  settings: Settings,
  notifications: Notifications,
  company: Company,
  dashboard: Dashboard,
  schedule: Schedule,
  team: Team,
  requests: Requests,
  profile: Profile,

  // admin
  manageemployees: ManageEmployees,
  manageshifts: ManageShifts,
  overview: Overview,
};

export default async function Page({ params }: { params: Promise<{ page: string }> | { page: string } }) {
  const resolved = await params;
  const page = resolved?.page;
  const Comp = page ? PAGES[page] : undefined;
  if (!Comp) return notFound();
  return <Comp />;
}
