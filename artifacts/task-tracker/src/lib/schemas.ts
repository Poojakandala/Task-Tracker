import { z } from "zod";
import { TaskInputStatus } from "@workspace/api-client-react";

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(TaskInputStatus),
  dueDate: z.string().nullable().optional().refine(val => {
    if (!val) return true;
    return !isNaN(Date.parse(val));
  }, "Invalid date"),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
