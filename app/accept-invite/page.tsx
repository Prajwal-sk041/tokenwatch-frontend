"use client";

import { useState } from "react";
import Link from "next/link";
import API from "@/lib/api";

export default function AcceptInvitePage() {
  const [message, setMessage] = useState("Sign in first, then accept your organization invitation.");
  async function accept() {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) { setMessage("The invitation link is incomplete."); return; }
    try { await API.post("/organizations/invites/accept", { token }); setMessage("Invitation accepted. Open the dashboard to continue."); }
    catch { setMessage("Sign in with the invited email, or request a new invitation."); }
  }
  return <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4"><div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 text-center space-y-4"><h1 className="text-2xl font-bold">Organization invitation</h1><p>{message}</p><button onClick={accept} className="w-full rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-3 font-semibold">Accept invitation</button><Link className="block font-semibold underline" href="/login">Sign in</Link></div></main>;
}
