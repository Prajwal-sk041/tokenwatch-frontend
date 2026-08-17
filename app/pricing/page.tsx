"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { getBillingPlans } from "@/lib/api";

type Plan = { code: string; name: string; description: string; monthly_price: number; entitlements: Record<string, number | boolean> };
const capabilities: Record<string, string[]> = {
  free: ["Cross-provider cost dashboard", "Two budgets and alerts", "7-day audit history", "One accountable member"],
  starter: ["Forecast and spend-risk signals", "Hard-stop budget policies", "Exports and API access", "Three separately auditable members"],
  pro: ["Spend Autopilot insights", "Model cost-review opportunities", "Advanced cost allocation", "365-day audit history"],
  team: ["Multi-workspace governance", "High-volume budgets and alerts", "50 member seats with roles", "Priority operational support"],
  enterprise: ["Custom retention and limits", "SSO and security review", "Private deployment options", "Contracted support and SLA"],
};

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => { getBillingPlans().then((response) => setPlans(response.data)); }, []);
  return <main className="min-h-screen bg-slate-950 px-6 py-16 text-white"><div className="mx-auto max-w-7xl">
    <Link href="/" className="text-cyan-300">← TokenWatch</Link>
    <div className="mt-10 max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[.2em] text-cyan-300">Plans built around control</p><h1 className="mt-4 text-5xl font-semibold tracking-tight">Pay for financial protection—not a larger dashboard.</h1><p className="mt-5 text-lg text-slate-300">Every tier preserves accurate tracking. Paid tiers add stronger prevention, accountability, retention, and operational control.</p></div>
    <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">{plans.map((plan) => <section key={plan.code} className={`relative rounded-3xl border p-6 ${plan.code === "pro" ? "border-cyan-300 bg-cyan-300/10 shadow-2xl shadow-cyan-950" : "border-white/15 bg-white/[.03]"}`}>
      {plan.code === "pro" && <span className="absolute -top-3 left-5 rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-slate-950">Best for growing teams</span>}
      <h2 className="text-2xl font-semibold">{plan.name}</h2><p className="mt-3 min-h-16 text-sm text-slate-300">{plan.description}</p>
      <p className="mt-5 text-3xl font-semibold">{plan.code === "enterprise" ? "Custom" : `$${plan.monthly_price}`}<span className="text-sm font-normal text-slate-400">{plan.code === "enterprise" ? "" : "/month"}</span></p>
      <p className="mt-2 text-xs text-slate-400">{plan.entitlements?.monthly_requests === -1 ? "Custom request capacity" : `${Number(plan.entitlements?.monthly_requests || 0).toLocaleString()} requests/month`}</p><div className="my-5 h-px bg-white/10" />
      <ul className="space-y-3 text-sm text-slate-200">{(capabilities[plan.code] || []).map((feature) => <li key={feature} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-cyan-300" />{feature}</li>)}</ul>
      <Link href={plan.code === "enterprise" ? "/contact" : "/register"} className="mt-7 inline-flex w-full justify-center rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-200">{plan.code === "enterprise" ? "Contact sales" : "Start free"}</Link>
    </section>)}</div>
    <div className="mt-10 flex gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5 text-sm text-emerald-100"><ShieldCheck className="shrink-0 text-emerald-300" />Billing remains disabled until the payment processor is configured. Plan activation is already designed around signed, idempotent webhooks—not browser redirects.</div>
  </div></main>;
}
