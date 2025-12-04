import { Skeleton } from "@/components/ui/skeleton";

// Dashboard Tool Card Skeleton
export const ToolCardSkeleton = () => (
  <div className="bg-card/60 rounded-2xl p-3 sm:p-4 border border-border/30">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="w-4 h-4 rounded" />
    </div>
  </div>
);

// Dashboard Grid Skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-4 sm:space-y-6">
    {/* Hero Skeleton */}
    <div className="rounded-2xl sm:rounded-3xl border border-border/20 p-4 sm:p-6 bg-card/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-16 flex-1 sm:w-20 rounded-xl" />
          <Skeleton className="h-16 flex-1 sm:w-20 rounded-xl" />
          <Skeleton className="h-16 flex-1 sm:w-20 rounded-xl" />
        </div>
      </div>
    </div>

    {/* Tabs Skeleton */}
    <Skeleton className="h-12 w-full rounded-xl" />

    {/* Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {[...Array(6)].map((_, i) => (
        <ToolCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Profile Page Skeleton
export const ProfileSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <Skeleton className="h-24 w-full rounded-xl" />
    
    {/* Avatar */}
    <div className="flex justify-center">
      <Skeleton className="w-24 h-24 rounded-full" />
    </div>
    
    {/* Cards */}
    <Skeleton className="h-64 w-full rounded-xl" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

// Empty State Component
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
    {action}
  </div>
);

// Stats Card Skeleton
export const StatsCardSkeleton = () => (
  <div className="bg-background/60 p-3 rounded-xl border border-border/30 text-center">
    <Skeleton className="h-6 w-12 mx-auto mb-1" />
    <Skeleton className="h-3 w-16 mx-auto" />
  </div>
);
