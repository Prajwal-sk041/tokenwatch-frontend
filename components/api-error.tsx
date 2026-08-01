export function ApiError({ message = "Unable to load this data. Please try again." }: { message?: string }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">{message}</div>;
}
