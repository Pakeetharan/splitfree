export default function GroupLoading() {
  return (
    <div className="animate-fade-in mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-surface-secondary" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-surface-secondary"
          />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-surface-secondary"
          />
        ))}
      </div>
    </div>
  );
}
