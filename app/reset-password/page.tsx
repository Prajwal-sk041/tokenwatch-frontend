"use client";

import { useState } from "react";
import Link from "next/link";
import API from "@/lib/api";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [complete, setComplete] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { toast.error("The reset link is incomplete."); return; }
    try { await API.post("/auth/password-reset/confirm", { token, new_password: password }); setComplete(true); }
    catch { toast.error("This reset link is invalid or expired."); }
  }
  return <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4"><div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 space-y-5"><h1 className="text-2xl font-bold">Reset password</h1>{complete ? <p>Password updated. <Link className="font-semibold underline" href="/login">Sign in</Link></p> : <form onSubmit={submit} className="space-y-4"><input className="w-full rounded-lg border p-3 dark:bg-zinc-800" type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" /><button className="w-full rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-3 font-semibold" type="submit">Update password</button></form>}</div></main>;
}
