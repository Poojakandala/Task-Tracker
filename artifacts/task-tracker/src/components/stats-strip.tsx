import { useGetTaskStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, ListTodo, Layers } from "lucide-react";

export function StatsStrip() {
  const { data: stats, isLoading } = useGetTaskStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="stats-loading">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur border-none shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="stats-strip">
      <StatCard 
        title="Total Tasks" 
        value={stats?.total || 0} 
        icon={<Layers className="w-4 h-4 text-primary" />} 
        testId="stat-total"
      />
      <StatCard 
        title="Pending" 
        value={stats?.pending || 0} 
        icon={<Clock className="w-4 h-4 text-amber-500" />} 
        testId="stat-pending"
      />
      <StatCard 
        title="In Progress" 
        value={stats?.inProgress || 0} 
        icon={<ListTodo className="w-4 h-4 text-blue-500" />} 
        testId="stat-in-progress"
      />
      <StatCard 
        title="Completed" 
        value={stats?.completed || 0} 
        icon={<CheckCircle2 className="w-4 h-4 text-green-500" />} 
        testId="stat-completed"
      />
    </div>
  );
}

function StatCard({ title, value, icon, testId }: { title: string, value: number, icon: React.ReactNode, testId: string }) {
  return (
    <Card className="bg-card border-none shadow-sm transition-all hover:shadow-md" data-testid={testId}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
