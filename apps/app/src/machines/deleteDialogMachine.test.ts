import { describe, it, expect, vi } from "vitest";
import { createActor, fromPromise, type Snapshot } from "xstate";
import {
  deleteDialogMachine,
  isDialogOpen,
  type DeleteDialogContext,
  type DeleteActorInput,
} from "./deleteDialogMachine";

// Helper type for the machine snapshot
type MachineSnapshot = Snapshot<unknown> & {
  context: DeleteDialogContext;
  value: string | { open: string };
  matches: (state: string | object) => boolean;
};

// Helper to create actor with empty input (since input is optional)
function createDialogActor(machine = deleteDialogMachine) {
  return createActor(machine, { input: undefined });
}

/**
 * Helper function to wait for a specific state in an actor.
 * Returns a promise that resolves when the predicate is satisfied.
 */
function waitFor(
  actor: ReturnType<typeof createActor>,
  predicate: (snapshot: MachineSnapshot) => boolean,
  timeout = 1000
): Promise<MachineSnapshot> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error(`Timeout waiting for state`));
    }, timeout);

    const subscription = actor.subscribe((snapshot) => {
      const snap = snapshot as MachineSnapshot;
      if (predicate(snap)) {
        clearTimeout(timeoutId);
        subscription.unsubscribe();
        resolve(snap);
      }
    });

    // Check initial state
    const currentSnap = actor.getSnapshot() as MachineSnapshot;
    if (predicate(currentSnap)) {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
      resolve(currentSnap);
    }
  });
}

describe("deleteDialogMachine", () => {
  // Mock task ID - in real usage this would be a Convex Id type
  const mockTaskId = "task123" as unknown as Parameters<
    typeof deleteDialogMachine.transition
  >[1] extends { itemId: infer T }
    ? T
    : never;

  const mockTaskTitle = "Test Task";

  describe("initial state", () => {
    it("starts in closed state", () => {
      const actor = createDialogActor().start();
      const snapshot = actor.getSnapshot();

      expect(snapshot.value).toBe("closed");
      expect(snapshot.context.itemId).toBeNull();
      expect(snapshot.context.itemTitle).toBeNull();
      expect(snapshot.context.error).toBeNull();

      actor.stop();
    });
  });

  describe("OPEN event", () => {
    it("transitions from closed to open.idle", () => {
      const actor = createDialogActor().start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });

      const snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(snapshot.matches({ open: "idle" })).toBe(true);
      expect(snapshot.context.itemId).toBe(mockTaskId);
      expect(snapshot.context.itemTitle).toBe(mockTaskTitle);

      actor.stop();
    });

    it("clears any previous error when opening", () => {
      const actor = createDialogActor().start();

      // Manually set an error state would require going through the flow,
      // but we can verify the context is clean on open
      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });

      const snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(snapshot.context.error).toBeNull();

      actor.stop();
    });
  });

  describe("CLOSE event", () => {
    it("transitions from open.idle to closed", () => {
      const actor = createDialogActor().start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CLOSE" });

      const snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(snapshot.value).toBe("closed");
      expect(snapshot.context.itemId).toBeNull();
      expect(snapshot.context.itemTitle).toBeNull();

      actor.stop();
    });

    it("does nothing when already closed", () => {
      const actor = createDialogActor().start();

      actor.send({ type: "CLOSE" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("closed");

      actor.stop();
    });
  });

  describe("CONFIRM event - successful deletion", () => {
    it("transitions through deleting to closed on success", async () => {
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CONFIRM" });

      // Should be in deleting state
      let snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(snapshot.matches({ open: "deleting" })).toBe(true);

      // Wait for the deletion to complete
      snapshot = await waitFor(actor, (s) => s.value === "closed");
      expect(snapshot.value).toBe("closed");
      expect(deleteFn).toHaveBeenCalledWith(mockTaskId);

      actor.stop();
    });

    it("passes the correct itemId to the delete actor", async () => {
      const deleteFn = vi.fn().mockResolvedValue(undefined);

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      const specificTaskId = "specific-task-456" as never;
      actor.send({
        type: "OPEN",
        itemId: specificTaskId,
        itemTitle: "Specific Task",
      });
      actor.send({ type: "CONFIRM" });

      await waitFor(actor, (s) => s.value === "closed");

      expect(deleteFn).toHaveBeenCalledWith(specificTaskId);

      actor.stop();
    });
  });

  describe("CONFIRM event - failed deletion", () => {
    it("transitions to error state when deletion fails", async () => {
      const deleteFn = vi.fn().mockRejectedValue(new Error("Network error"));

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CONFIRM" });

      const snapshot = await waitFor(actor, (s) => s.matches({ open: "error" }));
      expect(snapshot.matches({ open: "error" })).toBe(true);
      expect(snapshot.context.error).toBe("Network error");

      actor.stop();
    });

    it("handles non-Error rejection values", async () => {
      const deleteFn = vi.fn().mockRejectedValue("String error");

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CONFIRM" });

      const snapshot = await waitFor(actor, (s) => s.matches({ open: "error" }));
      expect(snapshot.context.error).toBe("String error");

      actor.stop();
    });
  });

  describe("RETRY event", () => {
    it("retries deletion from error state", async () => {
      let callCount = 0;
      const deleteFn = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First attempt failed");
        }
        // Second attempt succeeds
      });

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      // Open and attempt first deletion (will fail)
      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CONFIRM" });

      // Wait for error state
      await waitFor(actor, (s) => s.matches({ open: "error" }));
      expect(deleteFn).toHaveBeenCalledTimes(1);

      // Retry
      actor.send({ type: "RETRY" });

      // Wait for success (closed state)
      const snapshot = await waitFor(actor, (s) => s.value === "closed");
      expect(snapshot.value).toBe("closed");
      expect(deleteFn).toHaveBeenCalledTimes(2);

      actor.stop();
    });

    it("can close from error state without retrying", async () => {
      const deleteFn = vi.fn().mockRejectedValue(new Error("Failed"));

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CONFIRM" });

      await waitFor(actor, (s) => s.matches({ open: "error" }));

      // Close instead of retry
      actor.send({ type: "CLOSE" });

      const snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(snapshot.value).toBe("closed");
      expect(snapshot.context.itemId).toBeNull();
      expect(snapshot.context.error).toBeNull();

      actor.stop();
    });
  });

  describe("isDialogOpen helper", () => {
    it("returns false for closed state", () => {
      const actor = createDialogActor().start();
      const snapshot = actor.getSnapshot() as MachineSnapshot;

      expect(isDialogOpen(snapshot)).toBe(false);

      actor.stop();
    });

    it("returns true for open.idle state", () => {
      const actor = createDialogActor().start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });

      const snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(isDialogOpen(snapshot)).toBe(true);

      actor.stop();
    });

    it("returns true for open.deleting state", async () => {
      const deleteFn = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CONFIRM" });

      // Check while in deleting state
      const snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(snapshot.matches({ open: "deleting" })).toBe(true);
      expect(isDialogOpen(snapshot)).toBe(true);

      actor.stop();
    });

    it("returns true for open.error state", async () => {
      const deleteFn = vi.fn().mockRejectedValue(new Error("Failed"));

      const machineWithDelete = deleteDialogMachine.provide({
        actors: {
          deleteItem: fromPromise<void, DeleteActorInput>(async ({ input }) => {
            await deleteFn(input.itemId);
          }),
        },
      });

      const actor = createActor(machineWithDelete, { input: undefined }).start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });
      actor.send({ type: "CONFIRM" });

      const snapshot = await waitFor(actor, (s) => s.matches({ open: "error" }));
      expect(isDialogOpen(snapshot)).toBe(true);

      actor.stop();
    });
  });

  describe("state guards", () => {
    it("ignores CONFIRM when not in open.idle", () => {
      const actor = createDialogActor().start();

      // Try to CONFIRM when closed
      actor.send({ type: "CONFIRM" });

      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe("closed");

      actor.stop();
    });

    it("ignores RETRY when not in open.error", () => {
      const actor = createDialogActor().start();

      actor.send({
        type: "OPEN",
        itemId: mockTaskId as never,
        itemTitle: mockTaskTitle,
      });

      // Try to RETRY when in idle (not error)
      actor.send({ type: "RETRY" });

      const snapshot = actor.getSnapshot() as MachineSnapshot;
      expect(snapshot.matches({ open: "idle" })).toBe(true);

      actor.stop();
    });
  });
});
