"use client";

export default function ErrorPage({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">The page could not be loaded. No sensitive error details were displayed.</p>
        <button onClick={unstable_retry} className="mt-6 rounded-lg bg-zinc-900 px-5 py-2.5 text-white dark:bg-white dark:text-zinc-900">Try again</button>
      </div>
    </main>
  );
}
