import { fromPromise } from "xstate";
import { useMachine } from "@xstate/react";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  deleteDialogMachine,
  isDialogOpen,
  type DeleteActorInput,
} from "@/machines/deleteDialogMachine";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export type DeleteTaskDialogProps = {
  /**
   * Callback to request opening the dialog.
   * Returns the send function to trigger OPEN event.
   */
  onOpenRequest?: (
    openDialog: (itemId: Id<"tasks">, itemTitle: string) => void
  ) => void;
};

/**
 * DeleteTaskDialog - A confirmation dialog for deleting tasks
 *
 * This component demonstrates the XState + Convex integration pattern:
 * - XState manages the UI workflow (open/close, loading, error states)
 * - Convex owns the server state (the actual deletion)
 * - machine.provide() injects the Convex mutation as an actor
 *
 * Usage:
 * ```tsx
 * function TaskList() {
 *   const openDialogRef = useRef<(id: Id<"tasks">, title: string) => void>();
 *
 *   return (
 *     <>
 *       <DeleteTaskDialog
 *         onOpenRequest={(openFn) => { openDialogRef.current = openFn; }}
 *       />
 *       <button onClick={() => openDialogRef.current?.(taskId, taskTitle)}>
 *         Delete
 *       </button>
 *     </>
 *   );
 * }
 * ```
 */
export function DeleteTaskDialog({ onOpenRequest }: DeleteTaskDialogProps) {
  // Get the Convex mutation - this is the "server state" side
  const removeTask = useMutation(api.tasks.remove);

  // Create the state machine with the Convex mutation injected
  const [snapshot, send] = useMachine(
    deleteDialogMachine.provide({
      actors: {
        // Inject the Convex mutation as an XState actor
        deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
          await removeTask({ id: input.itemId });
        }),
      },
    }),
    { input: undefined }
  );

  // Expose the open function to parent components
  const openDialog = (itemId: Id<"tasks">, itemTitle: string) => {
    send({ type: "OPEN", itemId, itemTitle });
  };

  // Call the onOpenRequest callback with our openDialog function
  // This allows parent components to trigger the dialog
  if (onOpenRequest) {
    onOpenRequest(openDialog);
  }

  // Derive UI state from the machine state
  const open = isDialogOpen(snapshot);
  const isDeleting = snapshot.matches({ open: "deleting" });
  const hasError = snapshot.matches({ open: "error" });
  const error = snapshot.context.error;
  const itemTitle = snapshot.context.itemTitle;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) {
          send({ type: "CLOSE" });
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              &ldquo;{itemTitle}&rdquo;
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasError && error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => send({ type: "CLOSE" })}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => send({ type: hasError ? "RETRY" : "CONFIRM" })}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : hasError ? "Retry" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Custom hook for managing the delete dialog state.
 * Provides a cleaner API for components that need to open the dialog.
 */
export function useDeleteTaskDialog() {
  const removeTask = useMutation(api.tasks.remove);

  const [snapshot, send] = useMachine(
    deleteDialogMachine.provide({
      actors: {
        deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
          await removeTask({ id: input.itemId });
        }),
      },
    }),
    { input: undefined }
  );

  return {
    snapshot,
    send,
    openDialog: (itemId: Id<"tasks">, itemTitle: string) => {
      send({ type: "OPEN", itemId, itemTitle });
    },
    closeDialog: () => {
      send({ type: "CLOSE" });
    },
    confirmDelete: () => {
      send({ type: snapshot.matches({ open: "error" }) ? "RETRY" : "CONFIRM" });
    },
    isOpen: isDialogOpen(snapshot),
    isDeleting: snapshot.matches({ open: "deleting" }),
    hasError: snapshot.matches({ open: "error" }),
    error: snapshot.context.error,
    itemTitle: snapshot.context.itemTitle,
  };
}

/**
 * Standalone DeleteTaskDialog that uses the hook internally.
 * This is a more self-contained version that exposes an imperative API.
 */
export function DeleteTaskDialogWithHook() {
  const {
    isOpen,
    isDeleting,
    hasError,
    error,
    itemTitle,
    closeDialog,
    confirmDelete,
  } = useDeleteTaskDialog();

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          closeDialog();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              &ldquo;{itemTitle}&rdquo;
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasError && error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={closeDialog} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : hasError ? "Retry" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
