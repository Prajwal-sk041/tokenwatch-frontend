"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import API from "@/lib/api";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("The verification link is incomplete.");
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    API.post("/auth/verify-email", { token })
      .then(() => setMessage("Email verified. You can now sign in."))
      .catch(() => setMessage("This verification link is invalid or expired."));
  }, []);
  return <main className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4"><div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 text-center space-y-4"><h1 className="text-2xl font-bold">Email verification</h1><p>{message}</p><Link className="font-semibold underline" href="/login">Return to sign in</Link></div></main>;
}
