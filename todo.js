export const TASKS_STORAGE_KEY = "cgx.todo.tasks";

const normaliseText = (text) => String(text ?? "").trim();

const isTaskRecord = (value) =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof value.id === "string" &&
      typeof value.text === "string" &&
      typeof value.completed === "boolean"
  );

const defaultCreateId = () =>
  globalThis.crypto?.randomUUID?.() ?? `task-${Date.now().toString(36)}`;

const sanitiseTasks = (tasks) =>
  Array.isArray(tasks)
    ? tasks.filter(isTaskRecord).map((task) => ({
        id: task.id,
        text: normaliseText(task.text),
        completed: task.completed
      }))
    : [];

export const addTask = (tasks, text, createId = defaultCreateId) => {
  const trimmedText = normaliseText(text);

  if (!trimmedText) {
    throw new Error("Task cannot be empty.");
  }

  const task = {
    id: createId(),
    text: trimmedText,
    completed: false
  };

  return {
    task,
    tasks: [...sanitiseTasks(tasks), task]
  };
};

export const toggleTask = (tasks, taskId) =>
  sanitiseTasks(tasks).map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );

export const deleteTask = (tasks, taskId) =>
  sanitiseTasks(tasks).filter((task) => task.id !== taskId);

export const saveTasks = (storage, tasks) => {
  const nextTasks = sanitiseTasks(tasks);

  storage.setItem(TASKS_STORAGE_KEY, JSON.stringify(nextTasks));

  return nextTasks;
};

export const loadTasks = (storage) => {
  const rawTasks = storage.getItem(TASKS_STORAGE_KEY);

  if (!rawTasks) {
    return [];
  }

  try {
    const parsedTasks = JSON.parse(rawTasks);

    return Array.isArray(parsedTasks) ? sanitiseTasks(parsedTasks) : [];
  } catch {
    return [];
  }
};

