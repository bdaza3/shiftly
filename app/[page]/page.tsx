import { notFound } from "next/navigation";
import React from "react";

import { Login } from "../src/pages/Login";
import { Signup } from "../src/pages/SignUp";
import { Register } from "../src/pages/register/Register";

import JoinCompany from "../src/pages/register/JoinCompany";
import Step2RoleSelection from "../src/pages/register/Step2RoleSelection";

import { SetupWorkStructure } from "../src/pages/setup/SetupWorkStructure";
import { SetupEmployees } from "../src/pages/setup/SetupEmployees";
import { SetupSchedule } from "../src/pages/setup/SetupSchedule";
import { SetupSuccess } from "../src/pages/setup/SetupSuccess";

import { Dashboard } from "../src/pages/Dashboard";
import { Company } from "../src/pages/Company";
import { Schedule } from "../src/pages/Schedule";
import { Team } from "../src/pages/Team";
import { Requests } from "../src/pages/Requests";
import { Profile } from "../src/pages/Profile";
import Settings from "../src/pages/Settings";
import { Notifications } from "../src/pages/Notifications";

import { ManageEmployees } from "../src/pages/admin/ManageEmployees";
import { ManageShifts } from "../src/pages/admin/ManageShifts";
import { Reports } from "../src/pages/admin/Reports";

// Map of page names to components - add new pages here
const PAGES: Record<string, React.ComponentType<any>> = {
  // auth
  login: Login,
  signup: Signup,
  register: Register,
  step2roleselection: Step2RoleSelection,
  joincompany: JoinCompany,
  setupworkstructure: SetupWorkStructure,
  setupemployees: SetupEmployees,
  setupschedule: SetupSchedule,
  setupsuccess: SetupSuccess,

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
  reports: Reports,
};

export default async function Page({ params }: { params: Promise<{ page: string }> | { page: string } }) {
  const resolved = await params;
  const page = resolved?.page;
  const Comp = page ? PAGES[page] : undefined;
  if (!Comp) return notFound();
  return <Comp />;
}
