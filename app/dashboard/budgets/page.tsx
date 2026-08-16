"use client";

import { FormEvent, useEffect, useState } from "react";
import { createBudget, deleteBudget, getBudgets, getUsageAggregate, updateBudget } from "@/lib/api";
import { useWorkspace } from "@/components/app-shell";
import { Card, PageHeader } from "@/components/page-header";

type Budget = { id:string; scope_type:string; scope_value?:string; period_type:string; amount:number; warning_threshold_percent:number; hard_stop_threshold_percent:number; action:string; is_active:boolean };

export default function Page() {
  const { organization, role } = useWorkspace();
  const [rows, setRows] = useState<Budget[]>([]);
  const [spend, setSpend] = useState({ daily: 0, monthly: 0 });
  const [error, setError] = useState("");
  async function load() {
    if (!organization) return;
    try {
      const [budgets, daily, monthly] = await Promise.all([getBudgets(organization.id), getUsageAggregate({preset:"today"}), getUsageAggregate({preset:"current_month"})]);
      setRows(budgets.data);
      setSpend({ daily: Number(daily.data.totals.cost), monthly: Number(monthly.data.totals.cost) });
      setError("");
    } catch { setError("Unable to load budget status right now."); }
  }
  useEffect(() => {
    if (!organization) return;
    Promise.all([getBudgets(organization.id), getUsageAggregate({preset:"today"}), getUsageAggregate({preset:"current_month"})])
      .then(([budgets, daily, monthly]) => {
        setRows(budgets.data);
        setSpend({ daily: Number(daily.data.totals.cost), monthly: Number(monthly.data.totals.cost) });
        setError("");
      })
      .catch(() => setError("Unable to load budget status right now."));
  }, [organization]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget), scope = String(form.get("scope_type"));
    try {
      await createBudget(organization!.id,{scope_type:scope,scope_value:scope==="organization"?null:String(form.get("scope_value")),period_type:form.get("period_type"),amount:Number(form.get("amount")),warning_threshold_percent:Number(form.get("warning")),hard_stop_threshold_percent:Number(form.get("hard")),action:form.get("action")});
      event.currentTarget.reset(); await load();
    } catch { setError("Unable to create this budget. Check the values and try again."); }
  }

  const money = (value:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
  return <div className="space-y-6"><PageHeader title="Budgets" description="Blocking works only when your application calls /policy/check before the provider request and honors the decision."/>{error&&<p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{role!=="viewer"&&<Card><form onSubmit={submit} className="grid gap-3 md:grid-cols-4"><select name="scope_type" aria-label="Scope" className="rounded border p-2"><option value="organization">Organization</option><option value="user">User</option><option value="provider">Provider</option><option value="model">Model</option></select><input name="scope_value" aria-label="Scope value" placeholder="Provider, model, or user ID" className="rounded border p-2"/><select name="period_type" aria-label="Period" className="rounded border p-2"><option value="monthly">Monthly</option><option value="daily">Daily</option></select><input name="amount" aria-label="Budget amount" required min="0" step="0.01" placeholder="Amount USD" className="rounded border p-2"/><input name="warning" aria-label="Warning threshold" type="number" defaultValue="80" min="0" max="100" className="rounded border p-2"/><input name="hard" aria-label="Hard stop threshold" type="number" defaultValue="100" min="0" max="100" className="rounded border p-2"/><select name="action" aria-label="Action" className="rounded border p-2"><option>block</option><option>warn</option><option>allow</option><option>log</option></select><button className="rounded bg-slate-900 p-2 text-white">Create budget</button></form></Card>}<div className="grid gap-4 lg:grid-cols-2">{rows.length===0?<Card>No budgets yet. Create a policy to evaluate spend.</Card>:rows.map(b=>{const current=b.scope_type==="organization"?(b.period_type==="daily"?spend.daily:spend.monthly):null;const remaining=current===null?null:Number(b.amount)-current;return <Card key={b.id}><div className="flex justify-between"><div><p className="font-semibold capitalize">{b.scope_type} · {b.period_type}</p><p className="text-sm text-slate-500">{b.scope_value||"Entire organization"}</p></div><span className="text-xs">{b.is_active?"Active":"Inactive"}</span></div><div className="mt-4 grid grid-cols-3 gap-3"><div><p className="text-xs text-slate-500">Budget</p><p className="font-semibold">{money(Number(b.amount))}</p></div><div><p className="text-xs text-slate-500">Spent</p><p className="font-semibold">{current===null?"Scoped":money(current)}</p></div><div><p className="text-xs text-slate-500">Remaining</p><p className={`font-semibold ${remaining!==null&&remaining<0?"text-rose-700":""}`}>{remaining===null?"See policy checks":money(remaining)}</p></div></div><p className="mt-3 text-sm text-slate-500">Warn {b.warning_threshold_percent}% · hard stop {b.hard_stop_threshold_percent}% · {b.action}</p>{role!=="viewer"&&<div className="mt-4 flex gap-2"><button className="rounded border px-3 py-1 text-sm" onClick={async()=>{await updateBudget(organization!.id,b.id,{is_active:!b.is_active});await load()}}>{b.is_active?"Disable":"Enable"}</button><button className="text-sm text-rose-700" onClick={async()=>{if(confirm("Delete this budget?")){await deleteBudget(organization!.id,b.id);await load()}}}>Delete</button></div>}</Card>})}</div></div>;
}
