"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LifeBuoy, MessageSquareText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createSupportTicket, SafeApiError } from "@/lib/api";

export default function Support() {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await createSupportTicket({
        category: String(form.get("category")),
        subject: String(form.get("subject")),
        message: String(form.get("message")),
        email: String(form.get("email")),
        page_url: location.href,
      });
      toast.success("Your request was received. We’ll reply by email.");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(
        error instanceof SafeApiError
          ? error.message
          : "We could not send your request.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b17] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex gap-5 text-sm">
          <Link href="/dashboard" className="text-cyan-300">
            ← Dashboard
          </Link>
          <Link href="/help" className="text-slate-400">
            Help center
          </Link>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <section className="space-y-6 pt-4">
            <div className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-300">
              <LifeBuoy />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              How can we help?
            </h1>
            <p className="max-w-md text-lg leading-8 text-slate-300">
              Send product questions, billing issues, bugs, feedback, or
              security reports. You can contact us with or without signing in.
            </p>
            <div className="space-y-3 text-sm text-slate-300">
              <p className="flex gap-3">
                <MessageSquareText className="text-violet-300" size={19} />
                Include the page and steps that led to the issue.
              </p>
              <p className="flex gap-3">
                <ShieldCheck className="text-emerald-300" size={19} />
                Never include passwords, provider secrets, or SDK keys.
              </p>
            </div>
          </section>
          <form
            onSubmit={submit}
            className="space-y-5 rounded-3xl border border-white/10 bg-white/[.06] p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-8"
          >
            <label className="block text-sm font-medium">
              Category
              <select
                name="category"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3"
              >
                <option>support</option>
                <option>billing</option>
                <option>bug</option>
                <option>feedback</option>
                <option>security</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Reply email
              <input
                required
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Subject
              <input
                required
                minLength={3}
                maxLength={160}
                name="subject"
                placeholder="What can we help with?"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Message
              <textarea
                required
                minLength={10}
                maxLength={10000}
                rows={7}
                name="message"
                placeholder="Describe what happened and what you expected…"
                className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-3"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send request"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
