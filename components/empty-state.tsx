export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
    <h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-zinc-500">{description}</p>
  </div>;
}
