import { useState, useEffect, useRef } from "react";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { Task, TaskStatus, useDeleteTask, getListTasksQueryKey, getGetTaskStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Trash2, Calendar, Clock, CheckCircle2, Circle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TaskFormDialog } from "./task-form-dialog";

interface TaskCardProps {
  task: Task;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteTask = useDeleteTask();

  const handleDelete = () => {
    deleteTask.mutate(
      { id: task.id },
      {
        onSuccess: () => {
          setIsDeleted(true);
          toast({ title: "Task deleted" });
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
          }, 300); // Wait for animation
        },
        onError: () => {
          toast({ title: "Failed to delete task", variant: "destructive" });
        }
      }
    );
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.Completed: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case TaskStatus.In_Progress: return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getDueDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    let color = "text-muted-foreground";
    let text = format(date, "MMM d, yyyy");
    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";

    if (task.status !== TaskStatus.Completed) {
      if (isPast(date) && !isToday(date)) {
        color = "text-destructive";
        text = `Overdue (${format(date, "MMM d")})`;
        badgeVariant = "destructive";
      } else if (isToday(date)) {
        color = "text-amber-600 dark:text-amber-500";
        text = "Due Today";
        badgeVariant = "default";
      } else if (isTomorrow(date)) {
        color = "text-amber-600 dark:text-amber-500";
        text = "Due Tomorrow";
        badgeVariant = "default";
      }
    } else {
      badgeVariant = "outline";
    }

    return (
      <Badge variant={badgeVariant} className={`font-normal ${badgeVariant === 'default' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' : ''}`}>
        <Calendar className="w-3 h-3 mr-1 inline" />
        {text}
      </Badge>
    );
  };

  if (isDeleted) {
    return null;
  }

  return (
    <>
      <Card 
        className={`group task-list-enter border-border shadow-sm hover:shadow-md transition-all duration-200 ${task.status === TaskStatus.Completed ? 'opacity-60 bg-muted/30' : 'bg-card'}`}
        style={{ animationDelay: `${index * 50}ms` }}
        data-testid={`card-task-${task.id}`}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start">
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon(task.status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
              <div>
                <h3 className={`font-semibold text-lg truncate ${task.status === TaskStatus.Completed ? 'line-through text-muted-foreground' : 'text-foreground'}`} data-testid={`text-task-title-${task.id}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-muted-foreground text-sm mt-1 line-clamp-2" data-testid={`text-task-desc-${task.id}`}>
                    {task.description}
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0 flex items-center gap-2">
                {task.dueDate && getDueDateDisplay(task.dueDate)}
                <Badge variant="outline" className="capitalize hidden sm:inline-flex">
                  {task.status}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 sm:mt-2">
              <span className="text-xs text-muted-foreground">
                Added {format(new Date(task.createdAt), "MMM d")}
              </span>
              
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={() => setIsEditOpen(true)}
                  data-testid={`button-edit-task-${task.id}`}
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
                  onClick={() => setIsDeleting(true)}
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TaskFormDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        taskId={task.id}
        initialTask={task}
      />

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTask.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteTask.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
