export function ApiError({ message = "Unable to load this data. Please try again.", onRetry }: { message?: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}{onRetry&&<button onClick={onRetry} className="ml-3 rounded border px-2 py-1">Retry</button>}</div>;
}
