"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import API, { requestPasswordReset } from "@/lib/api";
import { PASSWORD_REQUIREMENTS, passwordError } from "@/lib/password";

function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");
    try {
      if (!token) {
        await requestPasswordReset(String(form.get("email")));
        setComplete(true);
        setMessage("If that account exists, reset instructions were requested. Check your inbox and spam folder.");
        return;
      }
      const password = String(form.get("password"));
      const validationError = passwordError(password);
      if (validationError) { setMessage(validationError); return; }
      if (password !== form.get("confirm")) { setMessage("Passwords do not match."); return; }
      await API.post("/auth/password-reset/confirm", { token, new_password: password });
      setComplete(true);
      setMessage("Password updated. All existing sessions were signed out.");
    } catch { setMessage(token ? "This reset link is invalid or expired." : "Unable to request a reset right now. Please try again later."); }
  }

  return <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4"><div className="w-full max-w-md rounded-2xl bg-white p-8 space-y-5"><h1 className="text-2xl font-bold">{token?"Choose a new password":"Reset password"}</h1>{complete?<><p aria-live="polite">{message}</p><Link className="font-semibold underline" href="/login">Return to sign in</Link></>:<form onSubmit={submit} className="space-y-4">{token?<><label className="block text-sm">New password<input name="password" className="mt-1 w-full rounded-lg border p-3" type="password" minLength={5} required autoComplete="new-password"/></label><p className="text-xs text-slate-500">{PASSWORD_REQUIREMENTS}</p><label className="block text-sm">Confirm password<input name="confirm" className="mt-1 w-full rounded-lg border p-3" type="password" minLength={5} required autoComplete="new-password"/></label></>:<label className="block text-sm">Account email<input name="email" className="mt-1 w-full rounded-lg border p-3" type="email" required autoComplete="email"/></label>}{message&&<p role="alert" className="text-sm text-rose-700">{message}</p>}<button className="w-full rounded-lg bg-zinc-900 text-white p-3 font-semibold" type="submit">{token?"Update password":"Send reset instructions"}</button></form>}</div></main>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Loading password reset…</main>}><ResetPasswordForm/></Suspense>;
}
