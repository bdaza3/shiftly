import { notFound } from "next/navigation";
import React from "react";

import { Login } from "../src/pages/Login";
import { Signup } from "../src/pages/SignUp";
import { Register } from "../src/pages/Register";
import { Dashboard } from "../src/pages/Dashboard";
import Settings from "../src/pages/Settings";
import { Notifications } from "../src/pages/Notifications";
import { Company } from "../src/pages/Company";
import { Schedule } from "../src/pages/Schedule";
//import { Team } from "../src/pages/Team";
import { Requests } from "../src/pages/Requests";
import { Profile } from "../src/pages/Profile";
import { ManageEmployees } from "../src/pages/admin/ManageEmployees";
import { ManageShifts } from "../src/pages/admin/ManageShifts";
import { Overview } from "../src/pages/admin/Overview";

const PAGES: Record<string, React.ComponentType<any>> = {
  settings: Settings,
  notifications: Notifications,
  company: Company,
  dashboard: Dashboard,
  login: Login,
  signup: Signup,
  schedule: Schedule,
  requests: Requests,
  register: Register,
  profile: Profile,
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
