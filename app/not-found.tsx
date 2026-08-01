import Link from "next/link";

export default function NotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-center dark:bg-zinc-950">
    <div><p className="text-sm font-semibold text-zinc-500">404</p><h1 className="mt-2 text-3xl font-bold">Page not found</h1>
    <p className="mt-3 text-zinc-600 dark:text-zinc-400">The page you requested does not exist.</p>
    <Link href="/" className="mt-6 inline-block font-semibold underline">Return home</Link></div>
  </main>;
}
