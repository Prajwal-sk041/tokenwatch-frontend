"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import API, {
  deleteAlert,
  getAlertHistory,
  getAlerts,
  getKeys,
  getUsageAggregate,
  testAlert,
} from "@/lib/api";
import { useWorkspace } from "@/components/app-shell";
import { Card, PageHeader } from "@/components/page-header";
type A = {
  id: string;
  name: string;
  threshold: number;
  period: string;
  channel: string;
  is_active: boolean;
  provider?: string;
};
type H = { id: string; status: string; channel: string; triggered_at: string };
export default function Page() {
  const { role } = useWorkspace();
  const [rows, setRows] = useState<A[]>([]);
  const [history, setHistory] = useState<H[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const providers = [
    "openai",
    "anthropic",
    "gemini",
    "groq",
    "openrouter",
    "azure_openai",
    "aws_bedrock",
  ];
  const load = useCallback(
    () =>
      Promise.all([getAlerts(), getAlertHistory()]).then(([a, h]) => {
        setRows(a.data);
        setHistory(h.data);
      }),
    [],
  );
  useEffect(() => {
    void load();
    Promise.all([getKeys(), getUsageAggregate({ preset: "current_month" })])
      .then(([keys, usage]) => {
        const detected = new Set<string>(
          (keys.data || []).map((key: { provider: string }) => key.provider),
        );
        Object.keys(usage.data.breakdowns?.provider || {}).forEach((provider) =>
          detected.add(provider),
        );
        setConnectedProviders([...detected]);
      })
      .catch(() => setConnectedProviders([]));
  }, [load]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await API.post("/alerts/create", {
        alert_type: f.get("metric"),
        threshold: Number(f.get("threshold")),
        provider: f.get("provider"),
        period: f.get("period"),
        channel: f.get("channel"),
        destination: f.get("destination") || null,
      });
      e.currentTarget.reset();
      setError("");
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to create alert.",
      );
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Create one rule for all AI traffic or target any supported provider. Providers detected from your keys and usage are highlighted."
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {role !== "viewer" && (
        <Card>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
            <select
              name="metric"
              aria-label="Metric"
              className="rounded border p-2"
            >
              <option>cost</option>
              <option>tokens</option>
              <option>requests</option>
            </select>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              name="threshold"
              aria-label="Threshold"
              placeholder="Threshold"
              className="rounded border p-2"
            />
            <select
              name="provider"
              aria-label="Provider"
              className="rounded border p-2"
            >
              <option value="all">All providers combined</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider.replaceAll("_", " ")}
                  {connectedProviders.includes(provider) ? " — connected" : ""}
                </option>
              ))}
            </select>
            <select
              name="period"
              aria-label="Period"
              className="rounded border p-2"
            >
              <option>daily</option>
              <option>monthly</option>
            </select>
            <select
              name="channel"
              aria-label="Channel"
              className="rounded border p-2"
            >
              <option>email</option>
              <option>webhook</option>
              <option disabled>slack — coming soon</option>
              <option disabled>teams — coming soon</option>
            </select>
            <input
              name="destination"
              aria-label="Destination"
              placeholder="Email or HTTPS webhook"
              className="rounded border p-2"
            />
            <button className="rounded bg-slate-900 p-2 text-white md:col-span-3">
              Create alert
            </button>
          </form>
        </Card>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Rules</h2>
          <div className="mt-4 space-y-3">
            {rows.length === 0 ? (
              <p className="text-slate-500">No alert rules configured.</p>
            ) : (
              rows.map((a) => (
                <div key={a.id} className="rounded border p-3">
                  <div className="flex justify-between">
                    <p className="font-medium">{a.name}</p>
                    <span className="text-xs">
                      {a.is_active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {a.provider || "all providers"} · {a.channel} ·{" "}
                    {a.threshold} · {a.period}
                  </p>
                  {role !== "viewer" && (
                    <div className="mt-2 flex gap-3">
                      <button
                        className="text-sm text-cyan-700"
                        onClick={async () => {
                          try { await testAlert(a.id); setMessage("Test alert delivered. Check the destination and delivery history."); setError(""); await load(); }
                          catch (caught) { setError(caught instanceof Error ? caught.message : "Test delivery failed."); }
                        }}
                      >
                        Send test
                      </button>
                      <button
                        className="text-sm"
                        onClick={async () => {
                          await API.patch(`/alerts/toggle/${a.id}`);
                          await load();
                        }}
                      >
                        {a.is_active ? "Pause" : "Enable"}
                      </button>
                      <button
                        className="text-sm text-rose-700"
                        onClick={async () => {
                          if (confirm("Delete alert?")) {
                            await deleteAlert(a.id);
                            await load();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Delivery history</h2>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-slate-500">No alert deliveries yet.</p>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <span>
                    {h.channel} · {h.status}
                  </span>
                  <span>{new Date(h.triggered_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
