"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { register, resendVerification } from "@/lib/api";
import { PASSWORD_REQUIREMENTS, passwordError } from "@/lib/password";

export default function Page() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const validationError = passwordError(password);
    if (validationError) { setError(validationError); return; }
    if (password !== form.get("confirm")) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await register(email, password, String(form.get("name")));
      setPending(true);
      setEmailWarning(response.data.email_delivery !== true);
    } catch {
      setError("Unable to create the account. Check the fields or sign in if you already registered.");
    } finally { setLoading(false); }
  }

  async function resend() {
    setResendMessage("Requesting delivery…");
    try {
      await resendVerification(email);
      setResendMessage("Delivery requested. Check spam and contact support if no message arrives.");
    } catch { setResendMessage("Unable to request delivery right now. Please try again later."); }
  }

  if (pending) return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center"><h1 className="text-2xl font-semibold">Verify your email</h1><p className="mt-3 text-slate-600">Verification is required before sign-in. Check your inbox and spam folder.</p>{emailWarning&&<p role="alert" className="mt-3 text-sm text-amber-700">TokenWatch could not confirm that the verification message was sent. You can request another delivery below or contact support.</p>}<button onClick={resend} className="mt-5 rounded border px-4 py-2">Resend verification</button>{resendMessage&&<p aria-live="polite" className="mt-3 text-sm text-slate-600">{resendMessage}</p>}<Link href="/support" className="mt-4 block text-sm text-cyan-700">Contact support</Link><Link href="/login" className="mt-2 block text-sm text-cyan-700">Return to sign in</Link></section></main>;

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><section className="w-full max-w-md rounded-2xl border bg-white p-8"><Link href="/" className="font-bold">TokenWatch</Link><h1 className="mt-6 text-3xl font-semibold">Create your account</h1><p className="mt-2 text-sm text-slate-500">Start with a secure organization and 10,000 monthly events.</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm">Full name<input required name="name" autoComplete="name" className="mt-1 w-full rounded border p-3"/></label><label className="block text-sm">Email<input required name="email" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} className="mt-1 w-full rounded border p-3"/></label><label className="block text-sm">Password<input required minLength={5} name="password" type="password" autoComplete="new-password" aria-describedby="password-help" className="mt-1 w-full rounded border p-3"/></label><p id="password-help" className="text-xs text-slate-500">{PASSWORD_REQUIREMENTS}</p><label className="block text-sm">Confirm password<input required minLength={5} name="confirm" type="password" autoComplete="new-password" className="mt-1 w-full rounded border p-3"/></label>{error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}<button disabled={loading} className="w-full rounded bg-slate-900 p-3 font-medium text-white">{loading?"Creating account…":"Create account"}</button></form><p className="mt-5 text-center text-sm">Already registered? <Link href="/login" className="font-medium text-cyan-700">Sign in</Link></p></section></main>;
}
