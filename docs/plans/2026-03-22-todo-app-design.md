# To-Do App Design

## Context

`CGX-11` starts from a near-empty repository, so the fastest reliable path is a static application with a small tested state module and a thin DOM layer.

## Approaches Considered

1. Single-file app: fastest, but mixes state, persistence, and DOM concerns.
2. Static UI plus a small reusable task module: slightly more setup, but easier to test and maintain.
3. Framework setup: overkill for the ticket and incompatible with the plain HTML/CSS/JS requirement.

## Chosen Approach

Use a static `index.html` page, a responsive `styles.css`, a small `todo.js` state/persistence module, and an `app.js` DOM controller. This keeps the rendering layer simple while making the behavior testable without browser-only tooling.

## UI Direction

- Tone: editorial minimalism with warm paper neutrals and a sharp terracotta accent.
- Layout: split hero/detail layout on large screens that collapses to a single column on mobile.
- Memorable detail: a note-board feel with angled accent blocks and compact completion stats.

## Components

- Intro panel with app title, short guidance, and persistence note.
- Task form with text input, add button, and inline validation message.
- Task summary row showing total and completed counts.
- Task list with checkbox, task text, and delete button.
- Empty state when there are no tasks.

## Data Flow

1. On load, read tasks from `localStorage`.
2. Render the current list and stats.
3. On add/toggle/delete, update the in-memory array, persist it, and re-render.

## Error Handling

- Reject empty or whitespace-only submissions with a visible message.
- Treat malformed `localStorage` data as empty state rather than crashing.

## Testing Strategy

- Automated: Node tests for add, toggle, delete, save, and load behaviors.
- Runtime: browser validation for the full user walkthrough, including refresh persistence.

