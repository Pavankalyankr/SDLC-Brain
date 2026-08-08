/**
 * Module loading skeleton — shows instantly on navigation.
 */
export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div>
            <div className="skeleton h-5 w-44 rounded mb-2" />
            <div className="skeleton h-3.5 w-64 rounded" />
          </div>
        </div>
        <div className="skeleton h-10 w-60 rounded-lg" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="skeleton h-4 w-56 rounded" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="skeleton h-3 w-full rounded mb-1.5" />
            <div className="skeleton h-3 w-5/6 rounded mb-1.5" />
            <div className="skeleton h-3 w-4/6 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}