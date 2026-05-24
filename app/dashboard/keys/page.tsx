"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import API from "@/lib/api";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  created_at: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
  cohere: "Cohere",
  other: "Other",
};

const PROVIDER_COLORS: Record<string, string> = {
  openai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  anthropic: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  gemini: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  cohere: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  other: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export default function KeysPage() {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await API.get("/keys/list");
      setKeys(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        toast.error("Failed to load API keys");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateKey = (): boolean => {
    if (provider === "openai" && !apiKey.startsWith("sk-")) {
      toast.error("OpenAI keys must start with 'sk-'");
      return false;
    }
    if (provider === "anthropic" && !apiKey.startsWith("sk-ant-")) {
      toast.error("Anthropic keys must start with 'sk-ant-'");
      return false;
    }
    if (apiKey.length < 10) {
      toast.error("API key seems too short");
      return false;
    }
    return true;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateKey()) return;
    setSubmitting(true);
    try {
      await API.post("/keys/add", { name, provider, key_value: apiKey });
      toast.success("API key added!");
      setName(""); setProvider("openai"); setApiKey("");
      setShowForm(false);
      fetchKeys();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to add key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this API key?")) return;
    try {
      await API.delete(`/keys/delete/${id}`);
      toast.success("Key deleted");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {
      toast.error("Failed to delete key");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500 animate-pulse text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">

      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          🔐 TokenWatch
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
            Dashboard
          </Link>
          <Link href="/dashboard/alerts" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
            Alerts
          </Link>
          <button
            onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
            className="text-sm px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">🔑 API Keys</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
              Manage your provider API keys
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition"
          >
            {showForm ? "Cancel" : "+ Add Key"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAdd}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4"
          >
            <h3 className="font-semibold text-zinc-900 dark:text-white">Add New API Key</h3>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My OpenAI Key"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Gemini</option>
                <option value="cohere">Cohere</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                API Key{" "}
                <span className="text-zinc-400 font-normal text-xs">
                  {provider === "openai" && "(must start with sk-)"}
                  {provider === "anthropic" && "(must start with sk-ant-)"}
                </span>
              </label>
              <input
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  provider === "openai" ? "sk-..." :
                  provider === "anthropic" ? "sk-ant-..." :
                  "Your API key"
                }
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-200 transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Key"}
            </button>
          </form>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          {keys.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 text-sm">
              No API keys yet. Click <strong>+ Add Key</strong> to get started.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                <tr>
                  <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Name</th>
                  <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Provider</th>
                  <th className="text-left px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Added</th>
                  <th className="text-right px-6 py-3 text-zinc-500 dark:text-zinc-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {key.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PROVIDER_COLORS[key.provider] ?? PROVIDER_COLORS.other}`}>
                        {PROVIDER_LABELS[key.provider] ?? key.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="text-red-500 hover:text-red-700 font-medium transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}
