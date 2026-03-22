import test from "node:test";
import assert from "node:assert/strict";

let todoModule = {};

try {
  todoModule = await import("../todo.js");
} catch {
  todoModule = {};
}

const { TASKS_STORAGE_KEY, addTask, deleteTask, loadTasks, saveTasks, toggleTask } =
  todoModule;

const createStorage = (initial = {}) => {
  const state = { ...initial };

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(state, key) ? state[key] : null;
    },
    setItem(key, value) {
      state[key] = String(value);
    },
    dump() {
      return { ...state };
    }
  };
};

test("addTask trims input and appends a new incomplete task", () => {
  assert.equal(typeof addTask, "function");

  const { task, tasks } = addTask([], "  Buy oat milk  ", () => "task-1");

  assert.deepEqual(task, {
    id: "task-1",
    text: "Buy oat milk",
    completed: false
  });
  assert.deepEqual(tasks, [task]);
});

test("addTask rejects empty or whitespace-only submissions", () => {
  assert.equal(typeof addTask, "function");

  assert.throws(() => addTask([], "   ", () => "task-1"), /empty/i);
});

test("toggleTask flips the completion state for the matching task", () => {
  assert.equal(typeof toggleTask, "function");

  const tasks = [
    { id: "task-1", text: "Buy oat milk", completed: false },
    { id: "task-2", text: "Review notes", completed: true }
  ];

  assert.deepEqual(toggleTask(tasks, "task-1"), [
    { id: "task-1", text: "Buy oat milk", completed: true },
    { id: "task-2", text: "Review notes", completed: true }
  ]);
});

test("deleteTask removes the matching task and preserves the rest", () => {
  assert.equal(typeof deleteTask, "function");

  const tasks = [
    { id: "task-1", text: "Buy oat milk", completed: false },
    { id: "task-2", text: "Review notes", completed: true }
  ];

  assert.deepEqual(deleteTask(tasks, "task-1"), [
    { id: "task-2", text: "Review notes", completed: true }
  ]);
});

test("saveTasks writes the task list to localStorage using the shared key", () => {
  assert.equal(typeof saveTasks, "function");
  assert.equal(typeof TASKS_STORAGE_KEY, "string");

  const storage = createStorage();
  const tasks = [{ id: "task-1", text: "Buy oat milk", completed: false }];

  const result = saveTasks(storage, tasks);

  assert.equal(result.persisted, true);
  assert.deepEqual(result.tasks, tasks);
  assert.equal(storage.dump()[TASKS_STORAGE_KEY], JSON.stringify(tasks));
});

test("saveTasks keeps in-memory tasks when storage writes fail", () => {
  assert.equal(typeof saveTasks, "function");

  const tasks = [{ id: "task-1", text: "Buy oat milk", completed: false }];
  const storage = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("Quota exceeded");
    }
  };

  const result = saveTasks(storage, tasks);

  assert.equal(result.persisted, false);
  assert.match(result.error.message, /quota/i);
  assert.deepEqual(result.tasks, tasks);
});

test("loadTasks restores valid tasks and falls back safely for malformed data", () => {
  assert.equal(typeof loadTasks, "function");
  assert.equal(typeof TASKS_STORAGE_KEY, "string");

  const validStorage = createStorage({
    [TASKS_STORAGE_KEY]: JSON.stringify([
      { id: "task-1", text: "Buy oat milk", completed: false }
    ])
  });
  const invalidStorage = createStorage({
    [TASKS_STORAGE_KEY]: "{\"bad\":true}"
  });

  assert.deepEqual(loadTasks(validStorage), [
    { id: "task-1", text: "Buy oat milk", completed: false }
  ]);
  assert.deepEqual(loadTasks(invalidStorage), []);
});

test("loadTasks drops blank or invalid task records from persisted data", () => {
  assert.equal(typeof loadTasks, "function");

  const storage = createStorage({
    [TASKS_STORAGE_KEY]: JSON.stringify([
      { id: "task-1", text: "  Buy oat milk  ", completed: false },
      { id: "task-2", text: "   ", completed: true },
      { nope: true }
    ])
  });

  assert.deepEqual(loadTasks(storage), [
    { id: "task-1", text: "Buy oat milk", completed: false }
  ]);
});

test("loadTasks returns an empty list when storage access throws", () => {
  assert.equal(typeof loadTasks, "function");

  const storage = {
    getItem() {
      throw new Error("Access denied");
    }
  };

  assert.deepEqual(loadTasks(storage), []);
});

test("addTask generates unique fallback ids when crypto is unavailable", () => {
  assert.equal(typeof addTask, "function");

  const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  const originalNow = Date.now;

  Object.defineProperty(globalThis, "crypto", {
    value: undefined,
    configurable: true
  });
  Date.now = () => 1234567890;

  try {
    const first = addTask([], "First task");
    const second = addTask(first.tasks, "Second task");

    assert.notEqual(first.task.id, second.task.id);
  } finally {
    Date.now = originalNow;

    if (originalCrypto) {
      Object.defineProperty(globalThis, "crypto", originalCrypto);
    }
  }
});
