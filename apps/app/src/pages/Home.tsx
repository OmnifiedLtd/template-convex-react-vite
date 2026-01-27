import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * Home page - demonstrates basic CRUD operations with Convex
 */
export default function Home() {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const tasks = useQuery(api.tasks.list);
  const createTask = useMutation(api.tasks.create);
  const toggleTask = useMutation(api.tasks.toggle);
  const removeTask = useMutation(api.tasks.remove);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask({ title: newTaskTitle });
    setNewTaskTitle("");
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Task List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <Input
              type="text"
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <Button type="submit">Add</Button>
          </form>

          <div className="space-y-2">
            {tasks === undefined ? (
              <p className="text-sm text-muted-foreground">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet. Create one above!</p>
            ) : (
              tasks.map((task: Doc<"tasks">) => (
                <div
                  key={task._id}
                  className="flex items-center gap-2 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask({ id: task._id })}
                  />
                  <span
                    className={`flex-1 ${
                      task.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTask({ id: task._id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
