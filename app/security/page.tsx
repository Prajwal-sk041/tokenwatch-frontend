import { LegalPage, Section } from "@/components/legal-page";

export default function Page() {
  return <LegalPage title="Security and trust" updated="August 18, 2026">
    <Section title="Two integration modes"><p>Telemetry-only integrations send trusted usage measurements to TokenWatch and do not require provider credentials. Provider keys are needed only when a customer explicitly chooses a managed integration that calls a provider on their behalf.</p></Section>
    <Section title="Credential protection"><p>Provider credentials are encrypted before storage and are never returned in full after creation. TokenWatch SDK keys are one-way hashed, shown only once, scoped by permission, and can be rotated or revoked. Secrets must never be placed in browser code.</p></Section>
    <Section title="Tenant and account isolation"><p>Every organization-scoped API request is authorized server-side. Database row-level security provides defense in depth. A new personal sign-in replaces the prior device session, while team access uses separate invited accounts and roles for accountability.</p></Section>
    <Section title="Billing safety"><p>TokenWatch does not store payment-card details. Plan access is changed only after a payment provider webhook passes signature verification and idempotency checks. Billing remains unavailable when production credentials are absent.</p></Section>
    <Section title="Operational safeguards"><p>Controls include TLS, secure HTTP-only cookies, password hashing, session revocation, signed webhooks, rate limits, structured audit logs, dependency pinning, health checks, production monitoring, incident procedures, and documented backup and recovery processes.</p></Section>
    <Section title="Honest security claims"><p>TokenWatch does not claim certifications that have not been independently completed. Security reviews, data-processing requirements, retention questions, and suspected vulnerabilities can be submitted privately through support.</p></Section>
  </LegalPage>;
}
