import { motion } from "motion/react";

export function StreamingSkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-muted/60 animate-streaming ${className}`}
      aria-hidden="true"
    />
  );
}

export function CourseCatalogSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search and filter toolbar skeleton */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <StreamingSkeletonBlock className="h-11 w-full md:w-80 rounded-xl" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <StreamingSkeletonBlock key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Grid of streaming cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <StreamingSkeletonBlock className="h-5 w-20 rounded-lg" />
              <StreamingSkeletonBlock className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <StreamingSkeletonBlock className="h-6 w-3/4 rounded-lg" />
              <StreamingSkeletonBlock className="h-4 w-1/2 rounded-md" />
            </div>
            <div className="space-y-2 pt-2 border-t border-border/50">
              <StreamingSkeletonBlock className="h-4 w-full rounded-md" />
              <StreamingSkeletonBlock className="h-4 w-4/5 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <StreamingSkeletonBlock className="h-8 w-24 rounded-xl" />
              <StreamingSkeletonBlock className="h-8 w-24 rounded-xl" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TimetableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border/70 bg-card">
        <StreamingSkeletonBlock className="h-6 w-48 rounded-lg" />
        <StreamingSkeletonBlock className="h-8 w-24 rounded-xl" />
      </div>

      {/* Grid */}
      <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <StreamingSkeletonBlock key={i} className="h-9 rounded-xl" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, r) => (
          <div key={r} className="grid grid-cols-8 gap-2">
            <StreamingSkeletonBlock className="h-14 rounded-xl" />
            {Array.from({ length: 7 }).map((_, c) => (
              <StreamingSkeletonBlock
                key={c}
                className={`h-14 rounded-xl ${
                  (r + c) % 3 === 0 ? "opacity-90" : "opacity-40"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GradeDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-xs">
            <StreamingSkeletonBlock className="h-4 w-20 rounded-md" />
            <StreamingSkeletonBlock className="h-8 w-28 rounded-lg" />
            <StreamingSkeletonBlock className="h-3 w-16 rounded-md" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-xs">
        <StreamingSkeletonBlock className="h-6 w-40 rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StreamingSkeletonBlock key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/70 bg-card p-5 space-y-3 shadow-xs">
            <StreamingSkeletonBlock className="h-4 w-24 rounded-md" />
            <StreamingSkeletonBlock className="h-8 w-20 rounded-lg" />
            <StreamingSkeletonBlock className="h-3 w-28 rounded-md" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-4 shadow-xs">
        <StreamingSkeletonBlock className="h-6 w-44 rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <StreamingSkeletonBlock key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
