import { Router, type IRouter } from "express";
import { eq, ilike, or, asc, desc, SQL } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  ListTasksQueryParams,
  CreateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks", async (req, res): Promise<void> => {
  const parsed = ListTasksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, search, sortBy } = parsed.data;

  const conditions: SQL[] = [];

  if (status) {
    conditions.push(eq(tasksTable.status, status));
  }

  if (search) {
    conditions.push(
      or(
        ilike(tasksTable.title, `%${search}%`),
        ilike(tasksTable.description, `%${search}%`)
      ) as SQL
    );
  }

  let orderCol;
  if (sortBy === "dueDate") {
    orderCol = asc(tasksTable.dueDate);
  } else if (sortBy === "title") {
    orderCol = asc(tasksTable.title);
  } else {
    orderCol = desc(tasksTable.createdAt);
  }

  let query = db.select().from(tasksTable).orderBy(orderCol);

  if (conditions.length > 0) {
    let filtered = db.select().from(tasksTable);
    for (const cond of conditions) {
      filtered = filtered.where(cond) as typeof filtered;
    }
    const results = await filtered.orderBy(orderCol);
    res.json(results.map(formatTask));
    return;
  }

  const results = await query;
  res.json(results.map(formatTask));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, status, dueDate } = parsed.data;

  const [task] = await db
    .insert(tasksTable)
    .values({
      title,
      description: description ?? null,
      status: status ?? "Pending",
      dueDate: dueDate ?? null,
    })
    .returning();

  res.status(201).json(formatTask(task));
});

router.get("/tasks/stats", async (_req, res): Promise<void> => {
  const all = await db.select().from(tasksTable);
  const total = all.length;
  const pending = all.filter((t) => t.status === "Pending").length;
  const inProgress = all.filter((t) => t.status === "In Progress").length;
  const completed = all.filter((t) => t.status === "Completed").length;
  res.json({ total, pending, inProgress, completed });
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, params.data.id));

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

router.put("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if ("description" in parsed.data) updateData.description = parsed.data.description;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if ("dueDate" in parsed.data) updateData.dueDate = parsed.data.dueDate;

  const [task] = await db
    .update(tasksTable)
    .set(updateData)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json(formatTask(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [task] = await db
    .delete(tasksTable)
    .where(eq(tasksTable.id, params.data.id))
    .returning();

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.sendStatus(204);
});

function formatTask(task: typeof tasksTable.$inferSelect) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    dueDate: task.dueDate ?? null,
    createdAt: task.createdAt.toISOString(),
  };
}

export default router;
