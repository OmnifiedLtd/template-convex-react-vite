import { api } from "convex/_generated/api"
import type { Doc } from "convex/_generated/dataModel"
import { useMutation, useQuery } from "convex/react"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useDeleteTaskDialog } from "@/features/tasks"

/**
 * Home page - demonstrates basic CRUD operations with Convex
 *
 * This page now demonstrates XState integration for the delete dialog:
 * - XState manages the UI workflow (dialog open/close, loading, error states)
 * - Convex owns the server state (queries and mutations)
 * - The delete button triggers the XState machine instead of calling the mutation directly
 */
export default function Home() {
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const tasks = useQuery(api.tasks.list)
  const createTask = useMutation(api.tasks.create)
  const toggleTask = useMutation(api.tasks.toggle)

  // Use the XState-powered delete dialog
  const deleteDialog = useDeleteTaskDialog()

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    await createTask({ title: newTaskTitle })
    setNewTaskTitle("")
  }

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
                <div key={task._id} className="flex items-center gap-2 rounded-lg border p-3">
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
                    onClick={() => deleteDialog.openDialog(task._id, task.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* XState-powered delete confirmation dialog */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => {
          if (!open && !deleteDialog.isDeleting) {
            deleteDialog.closeDialog()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                &ldquo;{deleteDialog.itemTitle}&rdquo;
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteDialog.hasError && deleteDialog.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteDialog.error}
            </div>
          )}

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={deleteDialog.closeDialog}
              disabled={deleteDialog.isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteDialog.confirmDelete}
              disabled={deleteDialog.isDeleting}
            >
              {deleteDialog.isDeleting ? "Deleting..." : deleteDialog.hasError ? "Retry" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
