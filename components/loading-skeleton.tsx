export function StatsCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-secondary rounded w-24"></div>
        <div className="h-10 w-10 bg-secondary rounded-lg"></div>
      </div>
      <div className="h-8 bg-secondary rounded w-20 mb-2"></div>
      <div className="h-3 bg-secondary rounded w-16"></div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 bg-secondary rounded w-32"></div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-secondary rounded-lg"></div>
          <div className="h-10 w-24 bg-secondary rounded-lg"></div>
          <div className="h-10 w-24 bg-secondary rounded-lg"></div>
        </div>
      </div>
      <div className="h-[500px] bg-secondary/50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 bg-secondary rounded-lg mx-auto mb-4"></div>
          <div className="h-4 bg-secondary rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="p-6 border-b border-border">
        <div className="h-6 bg-secondary rounded w-40"></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <th key={i} className="text-left p-4">
                  <div className="h-4 bg-secondary-foreground/20 rounded w-20"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <td key={j} className="p-4">
                    <div className="h-4 bg-secondary rounded w-16"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SpinnerLoader() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )
}
