"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Coins,
  Database,
  Sparkles,
} from "lucide-react";
import { ApiError } from "@/components/api-error";
import { LoadingState } from "@/components/loading-state";
import { getUsageAggregate } from "@/lib/api";

type Aggregate = {
  totals: { requests: number; tokens: number; cost: number };
  breakdowns: Record<
    string,
    Record<string, { requests: number; tokens: number; cost: number }>
  >;
  daily: Array<{ date: string; cost: number }>;
  current_month_projection: number;
  timezone: string;
};
export default function Dashboard() {
  const [data, setData] = useState<Aggregate | null>(null);
  const [error, setError] = useState(false);
  const load = useCallback(() => {
    getUsageAggregate()
      .then((r) => {
        setData(r.data);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  if (error) return <ApiError onRetry={load} />;
  if (!data) return <LoadingState />;
  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cyan-700">
            Live cost intelligence
          </p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">
            Your AI control center
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            All dates and projections use UTC.
          </p>
        </div>
        <Link
          href="/dashboard/usage"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:-translate-y-0.5 hover:shadow-md"
        >
          Explore usage <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Requests",
            value: data.totals.requests.toLocaleString(),
            Icon: Activity,
            gradient: "from-cyan-500 to-blue-600",
          },
          {
            label: "Tokens",
            value: data.totals.tokens.toLocaleString(),
            Icon: Database,
            gradient: "from-violet-500 to-fuchsia-600",
          },
          {
            label: "Cost",
            value: money(data.totals.cost),
            Icon: Coins,
            gradient: "from-emerald-500 to-teal-600",
          },
          {
            label: "Month projection",
            value: money(data.current_month_projection),
            Icon: Sparkles,
            gradient: "from-amber-400 to-orange-600",
          },
        ].map(({ label, value, Icon, gradient }) => (
          <section
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,.06)] transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl transition group-hover:opacity-20`}
            />
            <div
              className={`inline-flex rounded-xl bg-gradient-to-br ${gradient} p-2.5 text-white`}
            >
              <Icon size={19} />
            </div>
            <p className="mt-4 text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {value}
            </p>
          </section>
        ))}
      </div>
      {data.totals.requests === 0 ? (
        <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-10 text-center text-white shadow-2xl">
          <div className="hero-grid pointer-events-none absolute inset-0" />
          <div className="relative">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300 ring-1 ring-cyan-300/20">
              <Sparkles />
            </span>
            <h2 className="mt-5 text-2xl font-semibold">
              Connect your first AI request
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-300">
              Complete onboarding to create an SDK key and verify a real test
              event.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-950/40 hover:-translate-y-0.5"
            >
              Start onboarding
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white bg-white p-6 shadow-lg shadow-slate-200/50">
            <h2 className="font-semibold">Provider breakdown</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(data.breakdowns.provider || {}).map(
                ([name, v]) => (
                  <div
                    key={name}
                    className="flex justify-between border-b pb-2 text-sm"
                  >
                    <span className="capitalize">{name}</span>
                    <span>
                      {v.requests} requests · ${v.cost.toFixed(4)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </section>
          <section className="rounded-2xl border border-white bg-white p-6 shadow-lg shadow-slate-200/50">
            <h2 className="font-semibold">Recent daily cost</h2>
            <div className="mt-4 flex h-40 items-end gap-2">
              {data.daily.slice(-14).map((d) => (
                <div
                  title={`${d.date}: $${d.cost}`}
                  key={d.date}
                  className="min-h-1 flex-1 rounded-t bg-cyan-500"
                  style={{
                    height: `${Math.max(4, Math.min(100, (d.cost / Math.max(...data.daily.map((x) => x.cost), 0.0001)) * 100))}%`,
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
