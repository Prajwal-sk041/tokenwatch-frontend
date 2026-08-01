"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/lib/api";
import { toast } from "sonner";

const PROVIDERS = ["all", "openai", "gemini", "anthropic"];
const PERIODS   = ["daily", "monthly"];

interface Alert {
  id:           string;
  alert_type:   string;
  threshold:    number;
  provider:     string;
  period:       string;
  is_active:    boolean;
  notify_email: string | null;
  created_at:   string;
}

interface HistoryItem {
  id:           string;
  provider:     string;
  alert_type:   string;
  current_val:  number;
  threshold:    number;
  triggered_at: string;
  email_sent:   boolean;
}

const TYPE_META: Record<string, { icon: string; unit: string; label: string }> = {
  cost:     { icon: "💰", unit: "$",  label: "Cost"     },
  tokens:   { icon: "🔢", unit: "",   label: "Tokens"   },
  requests: { icon: "📡", unit: "",   label: "Requests" },
};

const PROVIDER_COLORS: Record<string, string> = {
  all:       "#8b5cf6",
  openai:    "#10b981",
  gemini:    "#3b82f6",
  anthropic: "#f59e0b",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function AlertsPage() {
  const router = useRouter();
  const [alerts,     setAlerts]     = useState<Alert[]>([]);
  const [history,    setHistory]    = useState<HistoryItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<"rules" | "history">("rules");
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    alert_type:   "cost",
    threshold:    "",
    provider:     "all",
    period:       "daily",
    notify_email: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [aRes, hRes] = await Promise.all([
        API.get("/alerts/list"),
        API.get("/alerts/history"),
      ]);
      setAlerts(aRes.data  || []);
      setHistory(hRes.data || []);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.threshold || isNaN(+form.threshold)) {
      toast.error("Enter a valid threshold"); return;
    }
    setSubmitting(true);
    try {
      await API.post("/alerts/create", {
        alert_type:   form.alert_type,
        threshold:    parseFloat(form.threshold),
        provider:     form.provider,
        period:       form.period,
        notify_email: form.notify_email || null,
      });
      toast.success("✅ Alert rule created!");
      setForm({ alert_type: "cost", threshold: "", provider: "all", period: "daily", notify_email: "" });
      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await API.patch(`/alerts/toggle/${id}`);
      toast.success(`Alert ${!current ? "enabled ✅" : "paused ⏸"}`);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_active: !current } : a));
    } catch { toast.error("Failed to update alert"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this alert rule?")) return;
    try {
      await API.delete(`/alerts/delete/${id}`);
      toast.success("Alert deleted");
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch { toast.error("Failed to delete alert"); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <p className="text-zinc-500 animate-pulse text-lg">Loading alerts...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      {/* Navbar */}
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">🔐 TokenWatch</h1>
        <div className="flex items-center gap-5">
          <Link href="/dashboard"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
            Dashboard
          </Link>
          <Link href="/dashboard/keys"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
            API Keys
          </Link>
          <Link href="/dashboard/alerts"
            className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
            🔔 Alerts
          </Link>
          <button
            onClick={async () => { await API.post("/auth/logout"); router.push("/login"); }}
            className="text-sm px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 transition">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">🔔 Alert Rules</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              Get notified by email when usage exceeds your limits
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-700 transition">
            {showForm ? "✕ Cancel" : "+ New Rule"}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form onSubmit={handleAdd}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-base">➕ Create Alert Rule</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Alert Type */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Alert Type
                </label>
                <select value={form.alert_type}
                  onChange={e => setForm(f => ({ ...f, alert_type: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
                  <option value="cost">💰 Cost ($)</option>
                  <option value="tokens">🔢 Tokens</option>
                  <option value="requests">📡 Requests</option>
                </select>
              </div>

              {/* Provider */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Provider
                </label>
                <select value={form.provider}
                  onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
                  {PROVIDERS.map(p => <option key={p} value={p}>{cap(p)}</option>)}
                </select>
              </div>

              {/* Period */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Period
                </label>
                <select value={form.period}
                  onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900">
                  {PERIODS.map(p => <option key={p} value={p}>{cap(p)}</option>)}
                </select>
              </div>

              {/* Threshold */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Threshold {form.alert_type === "cost" ? "(USD $)" : "(count)"}
                </label>
                <input required type="number" min="0"
                  step={form.alert_type === "cost" ? "0.01" : "1"}
                  placeholder={form.alert_type === "cost" ? "e.g. 5.00" : "e.g. 10000"}
                  value={form.threshold}
                  onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>

              {/* Notify Email */}
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  Notify Email <span className="font-normal normal-case">(optional — leave blank for default)</span>
                </label>
                <input type="email" placeholder="override@email.com"
                  value={form.notify_email}
                  onChange={e => setForm(f => ({ ...f, notify_email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900" />
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-lg hover:bg-zinc-700 transition disabled:opacity-50 text-sm">
              {submitting ? "Creating..." : "✅ Create Alert Rule"}
            </button>
          </form>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden w-fit">
          {([
            { v: "rules",   l: `📋 Rules (${alerts.length})`   },
            { v: "history", l: `📜 History (${history.length})` },
          ] as { v: "rules" | "history"; l: string }[]).map(t => (
            <button key={t.v} onClick={() => setTab(t.v)}
              className={`px-5 py-2 text-sm font-semibold transition ${
                tab === t.v
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50"
              }`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Rules Tab */}
        {tab === "rules" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-4xl mb-3">🔕</p>
                <p className="text-zinc-500 font-semibold">No alert rules yet</p>
                <p className="text-zinc-400 text-sm mt-1">Click &quot;+ New Rule&quot; to get started</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                  <tr>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Type</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Provider</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Period</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Threshold</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Status</th>
                    <th className="text-right px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {alerts.map(alert => {
                    const meta = TYPE_META[alert.alert_type] ?? { icon: "🔔", unit: "", label: alert.alert_type };
                    return (
                      <tr key={alert.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition ${!alert.is_active ? "opacity-50" : ""}`}>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 font-medium text-zinc-900 dark:text-white">
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: `${PROVIDER_COLORS[alert.provider]}18`, color: PROVIDER_COLORS[alert.provider] }}>
                            {cap(alert.provider)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 capitalize">{alert.period}</td>
                        <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                          {meta.unit}{alert.alert_type === "cost"
                            ? alert.threshold.toFixed(2)
                            : alert.threshold.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            alert.is_active
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}>
                            {alert.is_active ? "● Active" : "○ Paused"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-3">
                          <button onClick={() => handleToggle(alert.id, alert.is_active)}
                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium transition text-xs">
                            {alert.is_active ? "⏸ Pause" : "▶ Enable"}
                          </button>
                          <button onClick={() => handleDelete(alert.id)}
                            className="text-red-500 hover:text-red-700 font-medium transition text-xs">
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
            {history.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-zinc-500 font-semibold">No alerts triggered yet</p>
                <p className="text-zinc-400 text-sm mt-1">Alerts appear here when thresholds are crossed</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                  <tr>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Alert</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Provider</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Usage / Limit</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Email</th>
                    <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Triggered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {history.map(h => {
                    const pct  = Math.round((h.current_val / h.threshold) * 100);
                    const over = pct >= 100;
                    const meta = TYPE_META[h.alert_type] ?? { icon: "🔔", unit: "", label: h.alert_type };
                    return (
                      <tr key={h.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1.5 font-semibold ${over ? "text-red-500" : "text-amber-500"}`}>
                            {over ? "🚨" : "⚠️"} {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: `${PROVIDER_COLORS[h.provider] ?? "#8b5cf6"}18`, color: PROVIDER_COLORS[h.provider] ?? "#8b5cf6" }}>
                            {cap(h.provider)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300 font-medium">
                          {meta.unit}{h.current_val.toFixed(4)} / {meta.unit}{h.threshold.toFixed(4)}
                          <span className={`ml-2 text-xs font-bold ${over ? "text-red-500" : "text-amber-500"}`}>
                            ({pct}%)
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            h.email_sent
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}>
                            {h.email_sent ? "✅ Sent" : "⚠️ Failed"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">
                          {new Date(h.triggered_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
