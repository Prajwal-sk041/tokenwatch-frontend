"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  createBudget,
  deleteBudget,
  getBudgets,
  getUsageAggregate,
  getPolicyHistory,
  updateBudget,
} from "@/lib/api";
import { useWorkspace } from "@/components/app-shell";
import { Card, PageHeader } from "@/components/page-header";

type Budget = {
  id: string;
  scope_type: string;
  scope_value?: string;
  period_type: string;
  amount: number;
  warning_threshold_percent: number;
  hard_stop_threshold_percent: number;
  action: string;
  is_active: boolean;
};
type PolicyDecision = { id: string; provider: string; model: string; decision: string; reason: string; estimated_cost: number; remaining_budget?: number; created_at: string };

export default function Page() {
  const { organization, role } = useWorkspace();
  const [rows, setRows] = useState<Budget[]>([]);
  const [spend, setSpend] = useState({ daily: 0, monthly: 0 });
  const [error, setError] = useState("");
  const [scope, setScope] = useState("organization");
  const [decisions, setDecisions] = useState<PolicyDecision[]>([]);
  async function load() {
    if (!organization) return;
    try {
      const [budgets, daily, monthly] = await Promise.all([
        getBudgets(organization.id),
        getUsageAggregate({ preset: "today" }),
        getUsageAggregate({ preset: "current_month" }),
      ]);
      setRows(budgets.data);
      setSpend({
        daily: Number(daily.data.totals.cost),
        monthly: Number(monthly.data.totals.cost),
      });
      setError("");
    } catch {
      setError("Unable to load budget status right now.");
    }
  }
  useEffect(() => {
    if (!organization) return;
    Promise.all([
      getBudgets(organization.id),
      getUsageAggregate({ preset: "today" }),
      getUsageAggregate({ preset: "current_month" }),
    ])
      .then(([budgets, daily, monthly]) => {
        setRows(budgets.data);
        setSpend({
          daily: Number(daily.data.totals.cost),
          monthly: Number(monthly.data.totals.cost),
        });
        setError("");
      })
      .catch(() => setError("Unable to load budget status right now."));
  }, [organization]);
  useEffect(() => { getPolicyHistory().then((response) => setDecisions(response.data)).catch(() => setDecisions([])); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      scope = String(form.get("scope_type"));
    try {
      await createBudget(organization!.id, {
        scope_type: scope,
        scope_value:
          scope === "organization" ? null : String(form.get("scope_value")),
        period_type: form.get("period_type"),
        amount: Number(form.get("amount")),
        warning_threshold_percent: Number(form.get("warning")),
        hard_stop_threshold_percent: Number(form.get("hard")),
        action: form.get("action"),
      });
      event.currentTarget.reset();
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create this budget.",
      );
    }
  }

  const money = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Set how much can be spent, what the limit covers, and the decision returned when the limit is reached."
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {role !== "viewer" && (
        <Card>
          <div className="mb-5 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-xl bg-cyan-50 p-3">
              <b>Budget amount</b>
              <p className="mt-1 text-slate-600">
                Maximum USD spend for the period.
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <b>Warning %</b>
              <p className="mt-1 text-slate-600">
                Notify before the budget is consumed.
              </p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3">
              <b>Hard stop %</b>
              <p className="mt-1 text-slate-600">
                Return a block decision at this point.
              </p>
            </div>
          </div>
          <form
            onSubmit={submit}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <label className="text-sm font-medium">
              Applies to
              <select
                name="scope_type"
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="organization">Entire organization</option>
                <option value="provider">One provider</option>
                <option value="model">One model</option>
                <option value="user">One user ID</option>
              </select>
            </label>
            {scope !== "organization" && (
              <label className="text-sm font-medium">
                {scope === "provider" ? "Provider" : "Exact value"}
                {scope === "provider" ? (
                  <select
                    required
                    name="scope_value"
                    className="mt-2 w-full rounded-xl border p-3"
                  >
                    {[
                      "openai",
                      "anthropic",
                      "gemini",
                      "groq",
                      "openrouter",
                      "azure_openai",
                      "aws_bedrock",
                    ].map((provider) => (
                      <option key={provider} value={provider}>
                        {provider.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    name="scope_value"
                    placeholder={
                      scope === "model" ? "e.g. gemini-1.5-flash" : "User UUID"
                    }
                    className="mt-2 w-full rounded-xl border p-3"
                  />
                )}
              </label>
            )}
            <label className="text-sm font-medium">
              Period
              <select
                name="period_type"
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Budget amount (USD)
              <input
                name="amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="25.00"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <label className="text-sm font-medium">
              Warning threshold (%)
              <input
                name="warning"
                type="number"
                defaultValue="80"
                min="0"
                max="100"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <label className="text-sm font-medium">
              Hard-stop threshold (%)
              <input
                name="hard"
                type="number"
                defaultValue="100"
                min="0"
                max="100"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <label className="text-sm font-medium">
              Decision at limit
              <select
                name="action"
                className="mt-2 w-full rounded-xl border p-3"
              >
                <option value="block">Block request</option>
                <option value="warn">Warn but allow</option>
                <option value="allow">Allow</option>
                <option value="log">Log only</option>
              </select>
            </label>
            <button className="self-end rounded-xl bg-slate-950 p-3 font-medium text-white">
              Create budget
            </button>
          </form>
        </Card>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.length === 0 ? (
          <Card>No budgets yet. Create a policy to evaluate spend.</Card>
        ) : (
          rows.map((b) => {
            const current =
              b.scope_type === "organization"
                ? b.period_type === "daily"
                  ? spend.daily
                  : spend.monthly
                : null;
            const remaining =
              current === null ? null : Number(b.amount) - current;
            return (
              <Card key={b.id}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold capitalize">
                      {b.scope_type} · {b.period_type}
                    </p>
                    <p className="text-sm text-slate-500">
                      {b.scope_value || "Entire organization"}
                    </p>
                  </div>
                  <span className="text-xs">
                    {b.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="font-semibold">{money(Number(b.amount))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Spent</p>
                    <p className="font-semibold">
                      {current === null ? "Scoped" : money(current)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Remaining</p>
                    <p
                      className={`font-semibold ${remaining !== null && remaining < 0 ? "text-rose-700" : ""}`}
                    >
                      {remaining === null
                        ? "See policy checks"
                        : money(remaining)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Warn {b.warning_threshold_percent}% · hard stop{" "}
                  {b.hard_stop_threshold_percent}% · {b.action}
                </p>
                {role !== "viewer" && (
                  <div className="mt-4 flex gap-2">
                    <button
                      className="rounded border px-3 py-1 text-sm"
                      onClick={async () => {
                        await updateBudget(organization!.id, b.id, {
                          is_active: !b.is_active,
                        });
                        await load();
                      }}
                    >
                      {b.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="text-sm text-rose-700"
                      onClick={async () => {
                        if (confirm("Delete this budget?")) {
                          await deleteBudget(organization!.id, b.id);
                          await load();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
      <Card>
        <h2 className="font-semibold">Policy decision history</h2>
        <p className="mt-1 text-sm text-slate-500">Evidence from SDK policy checks. A hard stop only protects traffic that calls the policy endpoint before the provider request.</p>
        <div className="mt-4 space-y-3">
          {decisions.length === 0 ? <p className="text-sm text-slate-500">No policy checks received yet.</p> : decisions.map((decision) => <div key={decision.id} className="flex flex-wrap items-start justify-between gap-3 border-b pb-3 text-sm"><div><p className="font-medium capitalize">{decision.decision} · {decision.provider} / {decision.model}</p><p className="text-slate-500">{decision.reason}</p></div><div className="text-right text-xs text-slate-500"><p>Estimate {money(Number(decision.estimated_cost))}</p><p>{new Date(decision.created_at).toLocaleString()}</p></div></div>)}
        </div>
      </Card>
    </div>
  );
}
