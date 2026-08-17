"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, PageHeader } from "@/components/page-header";
import { changePassword, getMe, getSessions, revokeSession, updateMe } from "@/lib/api";
import { PASSWORD_REQUIREMENTS, passwordError } from "@/lib/password";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({ full_name: "", email: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [sessions, setSessions] = useState<Array<{id:string;created_at:string;last_used_at?:string;expires_at:string;revoked_at?:string;ip_address?:string;user_agent?:string}>>([]);
  const loadSessions = () => getSessions().then(response => setSessions(response.data));
  useEffect(() => { getMe().then(response => setProfile(response.data)); void loadSessions(); }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setProfileMessage("");
    try { await updateMe(profile.full_name); setProfileMessage("Profile saved."); }
    catch { setProfileMessage("Unable to save your profile right now."); }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordMessage("");
    const form = new FormData(event.currentTarget);
    const next = String(form.get("new_password"));
    const validationError = passwordError(next);
    if (validationError) { setPasswordMessage(validationError); return; }
    if (next !== form.get("confirm_password")) { setPasswordMessage("Passwords do not match."); return; }
    try { await changePassword(String(form.get("current_password")), next); router.replace("/login?password_changed=1"); }
    catch { setPasswordMessage("Unable to change the password. Check your current password and try again."); }
  }

  return <div className="space-y-6"><PageHeader title="Account settings" description="Update your personal profile and security settings."/><div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="font-semibold">Profile</h2><form onSubmit={saveProfile} className="mt-4 space-y-4"><label className="block text-sm">Full name<input value={profile.full_name} onChange={event=>setProfile({...profile,full_name:event.target.value})} required autoComplete="name" className="mt-1 w-full rounded border p-2"/></label><label className="block text-sm">Email<input value={profile.email} readOnly className="mt-1 w-full rounded border bg-slate-50 p-2 text-slate-600"/></label>{profileMessage&&<p aria-live="polite" className="text-sm">{profileMessage}</p>}<button className="rounded bg-slate-900 px-4 py-2 text-white">Save profile</button></form></Card><Card><h2 className="font-semibold">Change password</h2><form onSubmit={savePassword} className="mt-4 space-y-4"><label className="block text-sm">Current password<input name="current_password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded border p-2"/></label><label className="block text-sm">New password<input name="new_password" type="password" minLength={5} required autoComplete="new-password" className="mt-1 w-full rounded border p-2"/></label><p className="text-xs text-slate-500">{PASSWORD_REQUIREMENTS}</p><label className="block text-sm">Confirm new password<input name="confirm_password" type="password" minLength={5} required autoComplete="new-password" className="mt-1 w-full rounded border p-2"/></label>{passwordMessage&&<p role="alert" className="text-sm text-rose-700">{passwordMessage}</p>}<button className="rounded bg-slate-900 px-4 py-2 text-white">Change password</button></form></Card></div><Card><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Active session</h2><p className="mt-1 text-sm text-slate-500">For account safety, a new sign-in replaces the previous device session. Team members must use separate invited accounts so activity remains auditable.</p></div></div><div className="mt-4 space-y-3">{sessions.filter(session=>!session.revoked_at).map(session=><div key={session.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="text-sm font-medium">{session.user_agent?.slice(0,80)||"Unknown device"}</p><p className="mt-1 text-xs text-slate-500">Signed in {new Date(session.created_at).toLocaleString()} · {session.ip_address||"IP unavailable"}</p></div><button onClick={async()=>{await revokeSession(session.id);router.replace("/login?session_revoked=1")}} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700">Sign out this device</button></div>)}{!sessions.some(session=>!session.revoked_at)&&<p className="text-sm text-slate-500">No active session found.</p>}</div></Card></div>;
}
