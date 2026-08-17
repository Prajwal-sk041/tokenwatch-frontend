"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clipboard, KeyRound } from "lucide-react";
import {
  createBudget,
  createSdkKey,
  getOnboarding,
  getIntegrationDiagnostics,
  getOrganizations,
  sendTestEvent,
  updateOnboarding,
} from "@/lib/api";

const providers: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-5",
  gemini: "gemini-3.5-flash",
  groq: "llama-3.3-70b-versatile",
  openrouter: "openai/gpt-4o-mini",
  azure_openai: "gpt-4o-mini",
  aws_bedrock: "anthropic.claude-3-5-sonnet",
};
export default function Onboarding() {
  const router = useRouter();
  const [org, setOrg] = useState("");
  const [step, setStep] = useState(1);
  const [integration, setIntegration] = useState("python");
  const [provider, setProvider] = useState("openai");
  const [secret, setSecret] = useState("");
  const [keyId, setKeyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [diagnostics, setDiagnostics] = useState<Array<{ code: string; label: string; complete: boolean; action: string }>>([]);
  void keyId;
  useEffect(() => {
    getOrganizations().then(async (r) => {
      const id = r.data[0]?.id;
      if (!id) return;
      setOrg(id);
      const p = await getOnboarding(id);
      setStep(p.data.completed_at ? 11 : p.data.current_step);
      setIntegration(p.data.integration_type || "python");
      setProvider(p.data.provider || "openai");
    });
  }, []);
  const persist = async (next: number) => {
    setStep(next);
    if (org)
      await updateOnboarding(org, {
        current_step: next,
        completed_steps: Array.from({ length: next - 1 }, (_, i) => i + 1),
        integration_type: integration,
        provider,
        completed: false,
        skipped: false,
      });
  };
  const sdkKey = secret || "tw_live_YOUR_KEY";
  const eventJson = `{\n  "provider": "${provider}",\n  "model": "${providers[provider]}",\n  "prompt_tokens": 12,\n  "completion_tokens": 8,\n  "idempotency_key": "replace-with-a-unique-request-id"\n}`;
  const snippets: Record<string, { label: string; run: string; code: string }> =
    {
      python: {
        label: "Python file",
        run: "Save as tokenwatch_test.py, then run: py tokenwatch_test.py",
        code: `import uuid\nimport requests\n\nevent = ${eventJson}\nevent["idempotency_key"] = str(uuid.uuid4())\nresponse = requests.post(\n    "https://tokenwatch-backend.vercel.app/v1/ingest/usage",\n    headers={"X-TokenWatch-Key": "${sdkKey}"},\n    json=event,\n    timeout=15,\n)\nresponse.raise_for_status()\nprint(response.json())`,
      },
      node: {
        label: "Node.js file",
        run: "Save as tokenwatch-test.mjs, then run: node tokenwatch-test.mjs",
        code: `const event = ${eventJson};\nevent.idempotency_key = crypto.randomUUID();\nconst response = await fetch("https://tokenwatch-backend.vercel.app/v1/ingest/usage", {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "X-TokenWatch-Key": "${sdkKey}" },\n  body: JSON.stringify(event),\n});\nif (!response.ok) throw new Error(await response.text());\nconsole.log(await response.json());`,
      },
      powershell: {
        label: "PowerShell",
        run: "Paste the complete block into PowerShell and press Enter",
        code: `$eventBody = @{\n  provider = "${provider}"\n  model = "${providers[provider]}"\n  prompt_tokens = 12\n  completion_tokens = 8\n  idempotency_key = [guid]::NewGuid().ToString()\n} | ConvertTo-Json\n\nInvoke-RestMethod -Method Post \`\n  -Uri "https://tokenwatch-backend.vercel.app/v1/ingest/usage" \`\n  -Headers @{ "X-TokenWatch-Key" = "${sdkKey}" } \`\n  -ContentType "application/json" \`\n  -Body $eventBody`,
      },
      rest: {
        label: "cURL",
        run: "Paste into macOS/Linux Terminal or Git Bash",
        code: `curl -X POST "https://tokenwatch-backend.vercel.app/v1/ingest/usage" \\\n+  -H "Content-Type: application/json" \\\n+  -H "X-TokenWatch-Key: ${sdkKey}" \\\n+  -d '${eventJson}'`,
      },
    };
  const snippet = snippets[integration];
  const next = () => persist(Math.min(11, step + 1));
  return (
    <main className="min-h-screen bg-slate-50 p-5 sm:p-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-700">Setup · Step {step} of 11</p>
            <h1 className="text-3xl font-semibold">Get TokenWatch working</h1>
          </div>
          <button
            onClick={async () => {
              await updateOnboarding(org, {
                current_step: step,
                completed_steps: [],
                integration_type: integration,
                provider,
                completed: false,
                skipped: true,
              });
              router.push("/dashboard");
            }}
            className="text-sm text-slate-500"
          >
            Skip for now
          </button>
        </div>
        <div className="mb-8 h-2 rounded bg-slate-200">
          <div
            className="h-2 rounded bg-cyan-500 transition-all"
            style={{ width: `${(step / 11) * 100}%` }}
          />
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold">Welcome to TokenWatch</h2>
              <p className="mt-3 text-slate-600">
                This guided setup creates a real scoped key, records a real test
                event, and adds your first budget.
              </p>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-semibold">
                Your organization is ready
              </h2>
              <p className="mt-3 text-slate-600">
                Your default organization was created securely during
                registration.
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-semibold">
                Where will you run the example?
              </h2>
              <p className="mt-2 text-slate-600">
                Choose your actual terminal or runtime. Every option is a
                complete runnable example.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["powershell", "python", "node", "rest"].map((x) => (
                  <button
                    type="button"
                    key={x}
                    onClick={() => setIntegration(x)}
                    className={`rounded-xl border p-4 capitalize transition ${integration === x ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-100" : "hover:border-slate-400"}`}
                  >
                    {x === "rest" ? "cURL / REST" : x}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <h2 className="text-2xl font-semibold">Create an SDK key</h2>
              <p className="mt-2 text-slate-600">
                The key can write usage and check policies. It is separate from
                provider credentials.
              </p>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await createSdkKey(org, {
                      name: "Onboarding SDK key",
                      permissions: ["usage:write", "policy:check"],
                    });
                    setSecret(r.data.key);
                    setKeyId(r.data.id);
                    setMessage("SDK key created");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-white"
              >
                {busy ? "Creating…" : "Create SDK key"}
              </button>
            </>
          )}
          {step === 5 && (
            <>
              <KeyRound />
              <h2 className="mt-3 text-2xl font-semibold">
                Copy your one-time secret
              </h2>
              {secret ? (
                <div className="mt-5 rounded-xl bg-slate-950 p-4 text-sm text-cyan-200">
                  <code className="break-all">{secret}</code>
                  <button
                    aria-label="Copy SDK key"
                    onClick={() => navigator.clipboard.writeText(secret)}
                    className="ml-3"
                  >
                    <Clipboard size={17} />
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-rose-600">
                  The secret is no longer available. Go back and create or
                  rotate a key.
                </p>
              )}
              <p className="mt-3 text-sm text-slate-500">
                TokenWatch will never show this secret again.
              </p>
            </>
          )}
          {step === 6 && (
            <>
              <h2 className="text-2xl font-semibold">Choose your provider</h2>
              <select
                aria-label="Provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-5 w-full rounded-lg border p-3"
              >
                {Object.keys(providers).map((p) => (
                  <option key={p} value={p}>
                    {p.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </>
          )}
          {step === 7 && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cyan-700">
                    {snippet.label}
                  </p>
                  <h2 className="text-2xl font-semibold">
                    Run the complete example
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(snippet.code);
                    setMessage("Example copied");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <Clipboard size={16} />
                  Copy
                </button>
              </div>
              <p className="mt-3 rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900">
                {snippet.run}
              </p>
              <pre className="mt-5 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-cyan-200">
                <code>{snippet.code}</code>
              </pre>
            </>
          )}
          {step === 8 && (
            <>
              <h2 className="text-2xl font-semibold">Send a real test event</h2>
              <p className="mt-2 text-slate-600">
                This validates your SDK key and writes an onboarding usage row.
              </p>
              <button
                disabled={!secret || busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const r = await sendTestEvent(org, {
                      sdk_key: secret,
                      provider,
                      model: providers[provider],
                    });
                    setMessage(
                      r.data.received ? "Test event received" : "Test failed",
                    );
                  } catch {
                    setMessage(
                      "Test event could not be verified. Retry with a new key.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-40"
              >
                {busy ? "Sending…" : "Send test event"}
              </button>
            </>
          )}
          {step === 9 && (
            <>
              <Check className="text-emerald-600" />
              <h2 className="mt-3 text-2xl font-semibold">
                Event receipt verified
              </h2>
              <p className="mt-2 text-slate-600">
                {message ||
                  "Complete the previous step to confirm a backend record."}
              </p>
            </>
          )}
          {step === 10 && (
            <>
              <h2 className="text-2xl font-semibold">
                Create your first budget
              </h2>
              <p className="mt-2 text-slate-600">
                Start with a $25 monthly organization budget and an 80% warning.
              </p>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await createBudget(org, {
                      scope_type: "organization",
                      scope_value: null,
                      period_type: "monthly",
                      amount: 25,
                      warning_threshold_percent: 80,
                      hard_stop_threshold_percent: 100,
                      action: "block",
                    });
                    setMessage("Budget created");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-white"
              >
                Create $25 budget
              </button>
            </>
          )}
          {step === 11 && (
            <>
              <Check className="text-emerald-600" />
              <h2 className="mt-3 text-2xl font-semibold">
                Onboarding complete
              </h2>
              <p className="mt-2 text-slate-600">
                Your workspace can now receive usage and evaluate budgets.
              </p>
              <button
                type="button"
                onClick={async () => { const response = await getIntegrationDiagnostics(org); setDiagnostics(response.data.checks); }}
                className="mt-5 rounded-lg border px-4 py-2 text-sm"
              >
                Run readiness check
              </button>
              {diagnostics.length > 0 && <div className="mt-4 space-y-2">{diagnostics.map((check) => <div key={check.code} className={`flex items-center gap-2 rounded-lg p-3 text-sm ${check.complete ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}><Check size={16} />{check.label}: {check.complete ? "ready" : "action needed"}</div>)}</div>}
            </>
          )}
          {message && step !== 9 && (
            <p role="status" className="mt-4 text-sm text-emerald-700">
              {message}
            </p>
          )}
          <div className="mt-8 flex justify-between">
            <button
              disabled={step === 1}
              onClick={() => persist(step - 1)}
              className="rounded-lg border px-4 py-2 disabled:opacity-30"
            >
              Back
            </button>
            {step < 11 ? (
              <button
                onClick={next}
                className="rounded-lg bg-cyan-500 px-5 py-2 font-medium text-slate-950"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={async () => {
                  await updateOnboarding(org, {
                    current_step: 11,
                    completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    integration_type: integration,
                    provider,
                    completed: true,
                    skipped: false,
                  });
                  router.push("/dashboard");
                }}
                className="rounded-lg bg-cyan-500 px-5 py-2 font-medium"
              >
                Open dashboard
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
