import { addTask, deleteTask, loadTasks, saveTasks, toggleTask } from "./todo.js";

const countLabel = (tasks) => {
  const completedCount = tasks.filter((task) => task.completed).length;
  const taskLabel = tasks.length === 1 ? "task" : "tasks";

  return `${tasks.length} ${taskLabel} / ${completedCount} done`;
};

const createTaskItem = (document, task) => {
  const item = document.createElement("li");
  item.className = "task-item";
  if (task.completed) {
    item.dataset.completed = "true";
  }

  const label = document.createElement("label");
  label.className = "task-label";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  checkbox.dataset.action = "toggle";
  checkbox.dataset.taskId = task.id;
  checkbox.setAttribute("aria-label", `Mark ${task.text} as complete`);

  const text = document.createElement("span");
  text.className = "task-text";
  text.textContent = task.text;

  label.append(checkbox, text);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.dataset.action = "delete";
  deleteButton.dataset.taskId = task.id;
  deleteButton.setAttribute("aria-label", `Delete ${task.text}`);
  deleteButton.textContent = "Delete";

  item.append(label, deleteButton);

  return item;
};

export const initialiseApp = (documentRef = document, storage = window.localStorage) => {
  const form = documentRef.querySelector("[data-task-form]");
  const input = documentRef.querySelector("[data-task-input]");
  const feedback = documentRef.querySelector("[data-task-feedback]");
  const list = documentRef.querySelector("[data-task-list]");
  const summary = documentRef.querySelector("[data-task-count]");

  if (!form || !input || !feedback || !list || !summary) {
    return null;
  }

  let tasks = loadTasks(storage);

  const setFeedback = (message = "", tone = "neutral") => {
    feedback.textContent = message;
    feedback.dataset.tone = tone;
  };

  const persistAndRender = () => {
    tasks = saveTasks(storage, tasks);
    render();
  };

  const render = () => {
    summary.textContent = countLabel(tasks);
    list.replaceChildren();

    if (!tasks.length) {
      const emptyState = documentRef.createElement("li");
      emptyState.className = "empty-state";
      emptyState.textContent = "No tasks yet. Add one to start your day with a clear next move.";
      list.append(emptyState);
      return;
    }

    tasks.forEach((task) => {
      list.append(createTaskItem(documentRef, task));
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    try {
      const result = addTask(tasks, input.value);
      tasks = result.tasks;
      input.value = "";
      setFeedback(`Added "${result.task.text}".`, "success");
      persistAndRender();
      input.focus();
    } catch (error) {
      setFeedback(error.message, "error");
      input.focus();
    }
  });

  list.addEventListener("change", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.dataset.action !== "toggle") {
      return;
    }

    tasks = toggleTask(tasks, target.dataset.taskId);
    setFeedback("Task updated.", "neutral");
    persistAndRender();
  });

  list.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLButtonElement) || target.dataset.action !== "delete") {
      return;
    }

    tasks = deleteTask(tasks, target.dataset.taskId);
    setFeedback("Task removed.", "neutral");
    persistAndRender();
  });

  render();

  return {
    getTasks: () => [...tasks]
  };
};

if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initialiseApp();
    });
  } else {
    initialiseApp();
  }
}

