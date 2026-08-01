"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/components/api-error";
import { LoadingState } from "@/components/loading-state";
import { getUsageAggregate } from "@/lib/api";

type Aggregate={totals:{requests:number;tokens:number;cost:number};breakdowns:Record<string,Record<string,{requests:number;tokens:number;cost:number}>>;daily:Array<{date:string;cost:number}>;current_month_projection:number;timezone:string};
export default function Dashboard(){
  const[data,setData]=useState<Aggregate|null>(null);const[error,setError]=useState(false);
  const load=useCallback(()=>{getUsageAggregate().then(r=>{setData(r.data);setError(false)}).catch(()=>setError(true))},[]);
  useEffect(()=>{void load()},[load]);
  if(error)return <ApiError onRetry={load}/>;if(!data)return <LoadingState/>;
  const money=(value:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(value);
  return <div className="space-y-8"><div><p className="text-sm text-slate-500">Overview</p><h1 className="text-3xl font-semibold">AI usage at a glance</h1><p className="mt-2 text-sm text-slate-500">All dates and projections use UTC.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Requests",data.totals.requests.toLocaleString()],["Tokens",data.totals.tokens.toLocaleString()],["Cost",money(data.totals.cost)],["Month projection",money(data.current_month_projection)]].map(([k,v])=><section key={k} className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">{k}</p><p className="mt-2 text-2xl font-semibold">{v}</p></section>)}</div>{data.totals.requests===0?<section className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><h2 className="text-xl font-semibold">No usage received yet</h2><p className="mt-2 text-slate-500">Complete onboarding to create an SDK key and verify a real test event.</p><Link href="/onboarding" className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white">Start onboarding</Link></section>:<div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Provider breakdown</h2><div className="mt-4 space-y-3">{Object.entries(data.breakdowns.provider||{}).map(([name,v])=><div key={name} className="flex justify-between border-b pb-2 text-sm"><span className="capitalize">{name}</span><span>{v.requests} requests · ${v.cost.toFixed(4)}</span></div>)}</div></section><section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Recent daily cost</h2><div className="mt-4 flex h-40 items-end gap-2">{data.daily.slice(-14).map(d=><div title={`${d.date}: $${d.cost}`} key={d.date} className="min-h-1 flex-1 rounded-t bg-cyan-500" style={{height:`${Math.max(4,Math.min(100,d.cost/(Math.max(...data.daily.map(x=>x.cost),.0001))*100))}%`}}/>)}</div></section></div>}</div>;
}
