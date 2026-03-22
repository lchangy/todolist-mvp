# Demand Overview

## Scope v1

- Build a simple single-page to-do list web app with plain HTML, CSS, and JavaScript.
- Support adding a task, toggling completion, deleting a task, and restoring tasks from `localStorage`.
- Provide basic empty-input validation and a responsive, clean layout.

## Not Doing

- User accounts, syncing, due dates, priorities, filters, drag-and-drop, or categories.
- Server-side storage or any backend/API integration.
- Rich editing of existing tasks after creation.

## Core User Flows

1. User opens the page and sees an empty-state prompt plus an input and add button.
2. User enters a task and submits it, then sees it appended to the list immediately.
3. User toggles a checkbox and sees the task move into a completed visual state.
4. User refreshes the page and sees the same tasks restored from `localStorage`.
5. User deletes a task and sees it disappear from both the UI and persisted storage.

## Data Model

- `task`
  - `id`: string
  - `text`: string
  - `completed`: boolean

## Permissions Boundary

- Single local user only.
- Data is stored only in the browser's `localStorage`.

## Integrations

- Browser `localStorage`

## Assumptions

- A static site is sufficient because the ticket explicitly asks for HTML/CSS/JS only.
- Local Node tooling is available for lightweight automated tests.
- Browser runtime validation can be performed locally with a simple static server.

## Risks

- DOM behavior could drift from the tested task-state logic if the UI layer is not kept thin.
- Invalid data in `localStorage` could break rendering unless parsing is defensive.

## Validation Notes

- Use Node's built-in test runner for task-state and persistence helpers.
- Run a local browser validation for add, toggle, delete, and refresh persistence.

