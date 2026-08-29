export default function DashboardLoading() {
  return (
    <div className="animate-fade-in mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-24 animate-pulse rounded-xl bg-surface-secondary" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl bg-surface-secondary"
          />
        ))}
      </div>
    </div>
  );
}
