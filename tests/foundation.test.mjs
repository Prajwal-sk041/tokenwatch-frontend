import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (p) =>
  fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
test("commercial landing page contains factual journey and metadata", () => {
  const s = read("app/page.tsx");
  for (const text of [
    "Start free",
    "View documentation",
    "Budget circuit breaker",
    "Security by architecture",
    "Frequently asked questions",
  ])
    assert.match(s, new RegExp(text));
  assert.doesNotMatch(s, /testimonial|customers trust|SOC 2 certified/i);
});
test("API client uses a same-origin session proxy without localStorage", () => {
  const s = read("lib/api.ts"),
    p = read("app/api/backend/[...path]/route.ts");
  assert.match(s, /withCredentials: true/);
  assert.match(s, /\/api\/backend/);
  assert.match(p, /getSetCookie/);
  assert.match(p, /"origin"/);
  assert.match(p, /cache: "no-store"/);
  assert.doesNotMatch(s, /localStorage/);
});
test("registration has verification pending and resend states", () => {
  const s = read("app/register/page.tsx");
  assert.match(s, /Verify your email/);
  assert.match(s, /resendVerification/);
  assert.doesNotMatch(s, /SMTP is configured/);
});
test("password policy and account recovery are consistent", () => {
  const policy = read("lib/password.ts"),
    register = read("app/register/page.tsx"),
    reset = read("app/reset-password/page.tsx"),
    settings = read("app/dashboard/settings/page.tsx");
  for (const s of [policy, register, reset, settings])
    assert.match(s, /5|PASSWORD_REQUIREMENTS/);
  assert.match(policy, /uppercase/i);
  assert.match(policy, /number/i);
  assert.match(policy, /special/i);
  assert.match(reset, /requestPasswordReset/);
  assert.match(settings, /changePassword/);
});
test("protected routes use Next 16 proxy", () => {
  const s = read("proxy.ts");
  assert.match(s, /tw_access/);
  assert.match(s, /\/dashboard\/:path\*/);
});
test("onboarding creates one-time SDK key and verifies backend event", () => {
  const s = read("app/onboarding/page.tsx");
  assert.match(s, /one-time secret/);
  assert.match(s, /sendTestEvent/);
  assert.match(s, /Create your first budget/);
});
test("product pages expose real management states", () => {
  for (const p of [
    "app/dashboard/sdk-keys/page.tsx",
    "app/dashboard/budgets/page.tsx",
    "app/dashboard/alerts/page.tsx",
    "app/dashboard/team/page.tsx",
    "app/dashboard/billing/page.tsx",
  ])
    assert.ok(read(p).length > 500);
});
test("billing uses trusted checkout and portal endpoints", () => {
  const s = read("app/dashboard/billing/page.tsx");
  assert.doesNotMatch(s, /put\(.+subscriptions|changeSubscription/);
  assert.match(s, /createCheckout/);
  assert.match(s, /createBillingPortal/);
  assert.match(s, /Invoices/);
});
test("launch legal pages and SEO endpoints exist", () => {
  for (const p of [
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
    "app/cookies/page.tsx",
    "app/refunds/page.tsx",
    "app/security/page.tsx",
    "app/sitemap.ts",
    "app/robots.ts",
  ])
    assert.ok(read(p).length > 100);
});
test("phase five exposes status support docs and launch SEO", () => {
  for (const p of [
    "app/status/page.tsx",
    "app/support/page.tsx",
    "app/help/page.tsx",
    "app/use-cases/page.tsx",
    "app/comparisons/page.tsx",
    "app/integrations/page.tsx",
    "app/glossary/page.tsx",
    "app/blog/page.tsx",
    "app/api-docs/page.tsx",
    "app/dpa/page.tsx",
  ])
    assert.ok(read(p).length > 100);
});
test("security headers are configured", () => {
  const s = read("next.config.ts");
  for (const h of [
    "Content-Security-Policy",
    "X-Frame-Options",
    "Permissions-Policy",
  ])
    assert.match(s, new RegExp(h));
});
test("phase 56 usage UI exposes event time and IANA timezone interpretation", () => {
  const s = read("app/dashboard/usage/page.tsx");
  assert.match(s, /request_timestamp/);
  assert.match(s, /Asia\/Kolkata/);
  assert.match(s, /America\/Los_Angeles/);
  assert.match(s, /IANA timezone\s+boundaries/);
});
test("landing page does not claim billing is active", () => {
  const s = read("app/page.tsx");
  assert.doesNotMatch(
    s,
    /billing in Phase 4|Upgrade checkout becomes available in Phase 4/,
  );
  assert.match(s, /production billing activation/);
});
test("role controls distinguish invitation cancellation from member removal", () => {
  const s = read("app/dashboard/team/page.tsx");
  assert.match(s, /cancelInvite/);
  assert.match(s, /role\s*===\s*"owner"/);
  assert.match(s, /admin\s*&&\s*m.status\s*===\s*"invited"/);
});
test("PowerShell onboarding is runnable and does not present Python as a shell command", () => {
  const s = read("app/onboarding/page.tsx");
  assert.match(s, /Invoke-RestMethod/);
  assert.match(s, /ConvertTo-Json/);
  assert.match(s, /py tokenwatch_test.py/);
  assert.match(s, /complete runnable example/i);
});
test("budget form requires scoped values and explains thresholds", () => {
  const s = read("app/dashboard/budgets/page.tsx");
  assert.match(s, /scope !== "organization"/);
  assert.match(s, /required[\s\S]{0,80}name="scope_value"/);
  assert.match(s, /Warning threshold/);
  assert.match(s, /Hard-stop threshold/);
});
test("alerts expose the complete provider catalog and billing has safe states", () => {
  const alerts = read("app/dashboard/alerts/page.tsx"),
    billing = read("app/dashboard/billing/page.tsx");
  for (const provider of [
    "gemini",
    "groq",
    "openrouter",
    "azure_openai",
    "aws_bedrock",
  ])
    assert.match(alerts, new RegExp(provider));
  assert.match(alerts, /connectedProviders/);
  assert.match(billing, /billingAvailable/);
  assert.match(billing, /Contact sales/);
});
test("support accepts a reply email without forcing authentication", () => {
  const s = read("app/support/page.tsx");
  assert.match(s, /Reply email/);
  assert.match(s, /type="email"/);
  assert.doesNotMatch(s, /Sign in to send/);
});
test("competitive readiness exposes financial value and feature-based plans", () => {
  const dashboard = read("app/dashboard/page.tsx"),
    pricing = read("app/pricing/page.tsx"),
    api = read("lib/api.ts");
  assert.match(dashboard, /Spend Autopilot/);
  assert.match(dashboard, /Estimated spend prevented/);
  assert.match(dashboard, /Optimization opportunity/);
  assert.match(api, /usage\/insights/);
  assert.match(pricing, /financial protection/);
  assert.match(pricing, /Hard-stop budget policies/);
});
test("security trust page explains telemetry-only mode and accountable sessions", () => {
  const security = read("app/security/page.tsx"),
    settings = read("app/dashboard/settings/page.tsx");
  assert.match(security, /Telemetry-only/);
  assert.match(security, /one-way hashed/);
  assert.match(security, /does not claim certifications/);
  assert.match(settings, /new sign-in replaces the previous device\s+session/);
  assert.match(settings, /revokeSession/);
});
test("landing page answers why provider consoles are not enough", () => {
  const s = read("app/page.tsx");
  assert.match(s, /One financial control plane/);
  assert.match(s, /Why not use provider dashboards alone/);
  assert.match(s, /One view across every provider/);
  assert.match(s, /Budget decision before the next request/);
  assert.match(s, /Provider consoles remain the source for their invoices/);
});
test("launch hardening controls are visible to users", () => {
  const settings = read("app/dashboard/settings/page.tsx");
  const alerts = read("app/dashboard/alerts/page.tsx");
  const budgets = read("app/dashboard/budgets/page.tsx");
  const onboarding = read("app/onboarding/page.tsx");
  assert.match(settings, /Download my data/);
  assert.match(alerts, /Send test/);
  assert.match(budgets, /Policy decision history/);
  assert.match(onboarding, /Run readiness check/);
});
