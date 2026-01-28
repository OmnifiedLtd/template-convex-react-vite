import type { Id } from "convex/_generated/dataModel"
import { assign, fromPromise, setup } from "xstate"

/**
 * Delete Dialog State Machine
 *
 * This machine manages the state of a delete confirmation dialog with async deletion.
 * It demonstrates XState v5 patterns:
 * - setup() API for typed context/events
 * - Hierarchical states (open.idle, open.deleting, open.error)
 * - Invoked promise actors with input
 * - Dependency injection via machine.provide()
 *
 * States:
 * - closed: Dialog is not visible
 * - open.idle: Dialog is visible, awaiting user action
 * - open.deleting: Deletion in progress
 * - open.error: Deletion failed, showing error with retry option
 */

export type DeleteDialogContext = {
  /** The ID of the item to delete */
  itemId: Id<"tasks"> | null
  /** The title of the item (for display in confirmation) */
  itemTitle: string | null
  /** Error message if deletion failed */
  error: string | null
}

export type DeleteDialogEvents =
  | { type: "OPEN"; itemId: Id<"tasks">; itemTitle: string }
  | { type: "CLOSE" }
  | { type: "CONFIRM" }
  | { type: "RETRY" }

export type DeleteDialogInput = {
  itemId: Id<"tasks">
}

/**
 * Actor type for the delete operation.
 * This is defined separately to allow type-safe provide() calls.
 */
export type DeleteActorInput = { itemId: Id<"tasks"> }

export const deleteDialogMachine = setup({
  types: {
    context: {} as DeleteDialogContext,
    events: {} as DeleteDialogEvents,
    input: {} as DeleteDialogInput | undefined,
  },
  actors: {
    // Define the actor interface - implementation provided via machine.provide()
    deleteItem: fromPromise<void, DeleteActorInput>(async () => {
      // Default implementation throws - must be provided at runtime
      throw new Error("deleteItem actor not provided")
    }),
  },
  actions: {
    setItemToDelete: assign({
      itemId: ({ event }) => {
        if (event.type === "OPEN") return event.itemId
        return null
      },
      itemTitle: ({ event }) => {
        if (event.type === "OPEN") return event.itemTitle
        return null
      },
      error: () => null,
    }),
    clearItem: assign({
      itemId: () => null,
      itemTitle: () => null,
      error: () => null,
    }),
    setError: assign({
      error: ({ event }) => {
        // In XState v5, onError events have the error in event.error
        const errorEvent = event as unknown as { error: unknown }
        if (errorEvent.error instanceof Error) {
          return errorEvent.error.message
        }
        if (typeof errorEvent.error === "string") {
          return errorEvent.error
        }
        return "An unknown error occurred"
      },
    }),
  },
}).createMachine({
  id: "deleteDialog",
  initial: "closed",
  context: {
    itemId: null,
    itemTitle: null,
    error: null,
  },

  states: {
    closed: {
      on: {
        OPEN: {
          target: "open.idle",
          actions: "setItemToDelete",
        },
      },
    },

    open: {
      initial: "idle",
      states: {
        idle: {
          on: {
            CLOSE: {
              target: "#deleteDialog.closed",
              actions: "clearItem",
            },
            CONFIRM: "deleting",
          },
        },

        deleting: {
          invoke: {
            id: "deleteItem",
            src: "deleteItem",
            input: ({ context }) => ({
              itemId: context.itemId!,
            }),
            onDone: {
              target: "#deleteDialog.closed",
              actions: "clearItem",
            },
            onError: {
              target: "error",
              actions: "setError",
            },
          },
        },

        error: {
          on: {
            RETRY: "deleting",
            CLOSE: {
              target: "#deleteDialog.closed",
              actions: "clearItem",
            },
          },
        },
      },
    },
  },
})

/**
 * Helper to check if the dialog is in an open state
 */
export function isDialogOpen(
  state: { matches: (state: string | object) => boolean } | { value: string | object },
): boolean {
  if ("matches" in state) {
    return (
      state.matches({ open: "idle" }) ||
      state.matches({ open: "deleting" }) ||
      state.matches({ open: "error" })
    )
  }
  // For testing with raw state values
  const value = state.value
  if (typeof value === "object" && value !== null && "open" in value) {
    return true
  }
  return false
}
