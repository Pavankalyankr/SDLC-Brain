/**
 * Project overview loading skeleton
 */

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero header */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="skeleton h-12 w-12 rounded-xl" />
            <div>
              <div className="skeleton h-6 w-52 rounded mb-2" />
              <div className="skeleton h-4 w-80 rounded" />
            </div>
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-6 pt-4 border-t border-[var(--border)]">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-4 w-36 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Documents card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5">
            <div className="skeleton h-5 w-48 rounded mb-4" />
            <div className="rounded-xl border-2 border-dashed border-[var(--border)] p-8 flex flex-col items-center gap-3">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-3 w-36 rounded" />
            </div>
          </div>
          {/* Module grid */}
          <div>
            <div className="skeleton h-4 w-32 rounded mb-3" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
                  <div className="skeleton h-8 w-8 rounded-lg mb-3" />
                  <div className="skeleton h-3.5 w-20 rounded mb-1" />
                  <div className="skeleton h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
            <div className="skeleton h-5 w-36 rounded mb-4" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-9 w-full rounded-lg mb-2" />
            ))}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
            <div className="skeleton h-5 w-24 rounded mb-4" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton h-8 w-full rounded-lg mb-1.5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
