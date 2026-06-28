import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Task, TaskInputStatus, useCreateTask, useUpdateTask, useGetTask, getGetTaskQueryKey, getListTasksQueryKey, getGetTaskStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { taskSchema, TaskFormValues } from "../lib/schemas";
import { format } from "date-fns";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: number;
  initialTask?: Task; // Optional fallback
}

export function TaskFormDialog({ open, onOpenChange, taskId, initialTask }: TaskFormDialogProps) {
  const isEditing = !!taskId || !!initialTask;
  const targetId = taskId || initialTask?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Use useGetTask when we have an ID to ensure we have fresh data
  const { data: fetchedTask, isLoading: isLoadingTask } = useGetTask(
    targetId as number, 
    { 
      query: { 
        enabled: open && !!targetId,
        queryKey: getGetTaskQueryKey(targetId as number) 
      } 
    }
  );

  const taskData = fetchedTask || initialTask;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: TaskInputStatus.Pending,
      dueDate: "",
    },
  });

  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      if (taskData && targetId) {
        if (initializedForId.current !== targetId || fetchedTask) {
          form.reset({
            title: taskData.title,
            description: taskData.description || "",
            status: taskData.status as TaskInputStatus,
            dueDate: taskData.dueDate ? format(new Date(taskData.dueDate), "yyyy-MM-dd") : "",
          });
          initializedForId.current = targetId;
        }
      } else if (!targetId) {
        form.reset({
          title: "",
          description: "",
          status: TaskInputStatus.Pending,
          dueDate: "",
        });
        initializedForId.current = null;
      }
    } else {
      initializedForId.current = null;
    }
  }, [open, taskData, targetId, form, fetchedTask]);

  const onSubmit = (data: TaskFormValues) => {
    // Format date to ISO string if provided
    const payload = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
    };

    if (isEditing && targetId) {
      updateTask.mutate(
        { id: targetId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Task updated successfully" });
            queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(targetId) });
            onOpenChange(false);
          },
          onError: () => {
            toast({ title: "Failed to update task", variant: "destructive" });
          }
        }
      );
    } else {
      createTask.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Task created successfully" });
            queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
            onOpenChange(false);
          },
          onError: () => {
            toast({ title: "Failed to create task", variant: "destructive" });
          }
        }
      );
    }
  };

  const isPending = createTask.isPending || updateTask.isPending;
  const isDataLoading = isLoadingTask && !!targetId && open;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of your task." : "Create a new task to track."}
          </DialogDescription>
        </DialogHeader>
        
        {isDataLoading ? (
          <div className="py-8 flex justify-center text-muted-foreground text-sm">
            Loading task data...
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="What needs to be done?" {...field} data-testid="input-task-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any extra details here..." 
                        className="resize-none h-24"
                        {...field} 
                        value={field.value || ""}
                        data-testid="input-task-desc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-task-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TaskInputStatus.Pending}>Pending</SelectItem>
                          <SelectItem value={TaskInputStatus.In_Progress}>In Progress</SelectItem>
                          <SelectItem value={TaskInputStatus.Completed}>Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} data-testid="input-task-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-task">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} data-testid="button-save-task">
                  {isPending ? "Saving..." : "Save Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
