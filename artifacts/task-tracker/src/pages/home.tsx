import { useState, useMemo } from "react";
import { useListTasks } from "@workspace/api-client-react";
import { ListTasksStatus, ListTasksSortBy } from "@workspace/api-client-react";
import { StatsStrip } from "@/components/stats-strip";
import { TaskCard } from "@/components/task-card";
import { TaskFormDialog } from "@/components/task-form-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ListFilter, SlidersHorizontal, Inbox } from "lucide-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("All");
  const [sortBy, setSortBy] = useState<ListTasksSortBy>("createdAt" as ListTasksSortBy);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Debounce search input for API calls if needed, but since we are fetching from a fast API,
  // we can just use the state directly or use a simple debounce if performance is an issue.
  // For immediate feedback vibe, let's keep it responsive.
  const queryParams = useMemo(() => {
    const params: any = { sortBy };
    if (status !== "All") params.status = status as ListTasksStatus;
    if (search.length >= 2) params.search = search;
    return params;
  }, [status, sortBy, search]);

  const { data: tasks, isLoading, error } = useListTasks(queryParams);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/40 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground hidden sm:block">Tracker</h1>
          </div>
          
          <Button onClick={() => setIsAddOpen(true)} className="rounded-full shadow-md" data-testid="button-add-task-header">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsStrip />

        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <Tabs value={status} onValueChange={setStatus} className="w-full">
              <TabsList className="w-full justify-start md:justify-center p-1 bg-muted/50 border border-border/50">
                <TabsTrigger value="All" className="data-[state=active]:shadow-sm" data-testid="tab-all">All Tasks</TabsTrigger>
                <TabsTrigger value="Pending" className="data-[state=active]:shadow-sm" data-testid="tab-pending">Pending</TabsTrigger>
                <TabsTrigger value="In Progress" className="data-[state=active]:shadow-sm" data-testid="tab-in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="Completed" className="data-[state=active]:shadow-sm" data-testid="tab-completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-9 bg-card shadow-sm border-border/60 focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as ListTasksSortBy)}>
              <SelectTrigger className="w-[140px] bg-card shadow-sm border-border/60" data-testid="select-sort">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3" data-testid="task-list">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex gap-4">
                  <Skeleton className="w-5 h-5 rounded-full mt-1 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="text-center py-12 px-4 bg-destructive/5 border border-destructive/20 rounded-xl">
              <p className="text-destructive font-medium">Failed to load tasks</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : tasks?.length === 0 ? (
            <div className="text-center py-20 px-4 bg-muted/20 border border-dashed rounded-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                {search || status !== "All" ? (
                  <ListFilter className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <Inbox className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                {search || status !== "All" 
                  ? "Try adjusting your filters or search query to find what you're looking for."
                  : "You're all caught up! Add a new task to get started."}
              </p>
              {!(search || status !== "All") && (
                <Button onClick={() => setIsAddOpen(true)} data-testid="button-empty-add">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Task
                </Button>
              )}
            </div>
          ) : (
            tasks?.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))
          )}
        </div>
      </main>

      <TaskFormDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
    </div>
  );
}

// Temporary icon component since we can't import lucide directly in the JSX above easily without cluttering
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
