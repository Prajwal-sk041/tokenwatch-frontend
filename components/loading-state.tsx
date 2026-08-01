export function LoadingState({ label = "Loading" }: { label?: string }) {
  return <div role="status" className="flex items-center justify-center gap-3 p-8 text-zinc-500">
    <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />{label}…
  </div>;
}
