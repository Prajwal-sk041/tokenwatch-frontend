"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Activity, Bell, BookOpen, Building2, CreditCard, Gauge, KeyRound, LifeBuoy, LogOut, Menu, ScrollText, Settings, Shield, Users, Wallet, X } from "lucide-react";
import { getMe, getOrganizations, logout } from "@/lib/api";

type Org = { id: string; name: string; role: string; status: string };
type Workspace = { organization: Org | null; organizations: Org[]; role: string; loading: boolean };
const WorkspaceContext = createContext<Workspace>({ organization: null, organizations: [], role: "viewer", loading: true });
export const useWorkspace = () => useContext(WorkspaceContext);

const nav = [[Gauge,"Overview","/dashboard"],[Activity,"Usage","/dashboard/usage"],[Wallet,"Budgets","/dashboard/budgets"],[Bell,"Alerts","/dashboard/alerts"],[Shield,"Provider Keys","/dashboard/provider-keys"],[KeyRound,"SDK Keys","/dashboard/sdk-keys"],[Users,"Team","/dashboard/team"],[Building2,"Organization Settings","/dashboard/organization"],[Settings,"Account Settings","/dashboard/settings"],[CreditCard,"Billing","/dashboard/billing"],[ScrollText,"Audit Logs","/dashboard/audit"],[BookOpen,"Documentation","/docs"],[LifeBuoy,"Support & feedback","/support"]] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const [organizations,setOrganizations]=useState<Org[]>([]); const [active,setActive]=useState(0); const [mobile,setMobile]=useState(false); const [profile,setProfile]=useState<{full_name?:string,email?:string}>({});
  const pathname=usePathname(); const router=useRouter();
  useEffect(()=>{Promise.all([getOrganizations(),getMe()]).then(([o,m])=>{setOrganizations(o.data);setProfile(m.data)}).catch(()=>router.replace("/login"))},[router]);
  const organization=organizations[active]||null;
  const sidebar=<aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white p-4"><div className="flex items-center justify-between px-2 py-3"><Link href="/dashboard" className="text-xl font-bold">TokenWatch</Link><button className="md:hidden" aria-label="Close navigation" onClick={()=>setMobile(false)}><X/></button></div><label className="mt-4 text-xs font-medium text-slate-500" htmlFor="org-select">Organization</label><select id="org-select" className="mt-2 rounded-lg border border-slate-200 p-2" value={active} onChange={e=>setActive(Number(e.target.value))}>{organizations.map((o,i)=><option value={i} key={o.id}>{o.name}</option>)}</select><nav aria-label="Application" className="mt-6 flex-1 space-y-1 overflow-y-auto">{nav.map(([Icon,label,href])=><Link key={href} href={href} onClick={()=>setMobile(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${pathname===href?"bg-slate-900 text-white":"text-slate-600 hover:bg-slate-100"}`}><Icon size={17}/>{label}</Link>)}</nav><button onClick={async()=>{await logout();router.replace("/login")}} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><LogOut size={17}/>Logout</button></aside>;
  return <WorkspaceContext.Provider value={{organization,organizations,role:organization?.role||"viewer",loading:!organization}}><div className="min-h-screen bg-slate-50 text-slate-950"><div className="fixed inset-y-0 hidden md:block">{sidebar}</div>{mobile&&<div className="fixed inset-0 z-30 bg-black/30 md:hidden"><div className="h-full">{sidebar}</div></div>}<div className="md:pl-72"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8"><button className="md:hidden" aria-label="Open navigation" onClick={()=>setMobile(true)}><Menu/></button><div><p className="text-sm font-medium">{organization?.name||"Loading workspace…"}</p><p className="text-xs text-slate-500 capitalize">{organization?.role||""} · Free plan</p></div><div className="text-right"><p className="text-sm font-medium">{profile.full_name||"Account"}</p><p className="text-xs text-slate-500">{profile.email}</p></div></header><main className="p-4 sm:p-8">{children}</main></div></div></WorkspaceContext.Provider>;
}
