"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {getUsageEvents} from "@/lib/api";
import {Card,PageHeader} from "@/components/page-header";
type E={id:string;provider:string;model:string;total_tokens:number;calculated_cost:number;project:string;environment:string;request_timestamp:string;created_at:string};
const providers=["openai","anthropic","gemini","groq","openrouter","azure_openai","aws_bedrock"];
const ranges:[[string,string],[string,string],[string,string],[string,string],[string,string],[string,string]]=[["today","Today"],["yesterday","Yesterday"],["7d","Last 7 days"],["30d","Last 30 days"],["current_month","Current month"],["previous_month","Previous month"]];
export default function Page(){
 const browser=useMemo(()=>Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",[]);
 const[items,setItems]=useState<E[]>([]),[page,setPage]=useState(1),[more,setMore]=useState(false);
 const[provider,setProvider]=useState(""),[zone,setZone]=useState(browser),[preset,setPreset]=useState("30d");
 const load=useCallback(()=>getUsageEvents({page,page_size:25,preset,timezone:zone,...(provider?{provider}:{})}).then(r=>{setItems(r.data.items);setMore(r.data.has_more)}),[page,provider,preset,zone]);
 useEffect(()=>{void load()},[load]);
 const fmt=(v:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"medium",timeZone:zone}).format(new Date(v));
 const csv=()=>{const body=["event_timestamp,stored_timestamp,provider,model,tokens,cost,project,environment",...items.map(x=>[x.request_timestamp,x.created_at,x.provider,x.model,x.total_tokens,x.calculated_cost,x.project,x.environment].join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([body],{type:"text/csv"}));a.download="tokenwatch-usage.csv";a.click()};
 return <div className="space-y-6"><PageHeader title="Usage" description="Usage is reported by provider event time; storage time remains visible for troubleshooting."/><Card>
  <div className="flex flex-wrap gap-3"><select aria-label="Provider filter" value={provider} onChange={e=>{setProvider(e.target.value);setPage(1)}} className="rounded border p-2"><option value="">All providers</option>{providers.map(x=><option key={x}>{x}</option>)}</select><select aria-label="Reporting timezone" value={zone} onChange={e=>{setZone(e.target.value);setPage(1)}} className="rounded border p-2">{Array.from(new Set(["UTC","Asia/Kolkata","America/Los_Angeles",browser])).map(x=><option key={x}>{x}</option>)}</select><select aria-label="Date range" value={preset} onChange={e=>{setPreset(e.target.value);setPage(1)}} className="rounded border p-2">{ranges.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select><button onClick={csv} disabled={!items.length} className="rounded border px-3 py-2 text-sm">Export CSV</button></div>
  <p className="mt-3 text-xs text-slate-500">Selected timezone: {zone}. Range interpretation: {preset.replaceAll("_"," ")}. The server uses IANA timezone boundaries.</p>
  <div className="mt-5 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-slate-500"><th className="p-2">Event time</th><th>Stored</th><th>Provider</th><th>Model</th><th>Project</th><th>Environment</th><th>Tokens</th><th>Cost</th></tr></thead><tbody>{items.map(x=><tr key={x.id} className="border-b"><td className="p-2">{fmt(x.request_timestamp)}</td><td>{fmt(x.created_at)}</td><td>{x.provider}</td><td>{x.model}</td><td>{x.project}</td><td>{x.environment}</td><td>{x.total_tokens.toLocaleString()}</td><td>${Number(x.calculated_cost).toFixed(6)}</td></tr>)}</tbody></table>{!items.length&&<p className="p-10 text-center text-slate-500">No usage matches these filters.</p>}</div>
  <div className="mt-4 flex justify-between"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded border px-3 py-1 disabled:opacity-30">Previous</button><span>Page {page}</span><button disabled={!more} onClick={()=>setPage(p=>p+1)} className="rounded border px-3 py-1 disabled:opacity-30">Next</button></div>
 </Card></div>;
}
