import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  ["Real-time visibility", "See token usage and estimated API costs before budgets drift."],
  ["Project attribution", "Understand usage by provider, project, environment, and agent."],
  ["Budget alerts", "Set daily or monthly thresholds and receive early warnings."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <nav className="border-b border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">TokenWatch</Link>
          <div className="flex gap-3">
            <Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button>
            <Button asChild><Link href="/register">Get started</Link></Button>
          </div>
        </div>
      </nav>
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">AI usage monitoring</p>
        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">Keep AI API costs visible.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          TokenWatch brings OpenAI, Anthropic, and Gemini usage into one dashboard with attribution and budget alerts.
        </p>
        <Button asChild size="lg" className="mt-10"><Link href="/register">Start monitoring</Link></Button>
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-3">
        {features.map(([title, description]) => (
          <article key={title} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
