# PWA2 Agent Guide

This file defines implementation rules for `apps/pwa`.
Primary goal: ship with accessibility built in from the start, not as a late patch.

## Scope
- App workspace: `apps/pwa`
- Shared frontend workspace: `apps/shared`
- Legacy app (`PWA`) remains untouched unless explicitly requested.

## Accessibility-First Rules

1. Semantic structure
- Use real semantic elements (`header`, `nav`, `main`, `section`, `button`, `label`, `table`) before adding ARIA.
- Use headings in strict order on each page.

2. Keyboard support
- Every interactive element must be reachable and usable by keyboard.
- No click-only controls on non-interactive elements.
- Keep visible focus states (`:focus-visible`) on all controls.

3. Labels and names
- Inputs/selects/textareas must have programmatic labels.
- Icon-only buttons require `aria-label`.
- Status blocks and summary cards need readable text, not icon/color only.

4. Feedback and announcements
- Success/error/warning notices must be announced using live regions (`role="status"`/`role="alert"` as appropriate).
- After major actions (save/submit/approve), ensure focus and context remain clear.

5. Contrast and legibility
- Text and interactive controls should meet WCAG contrast expectations.
- Avoid low-contrast placeholder-like text for required information.
- Do not encode meaning with color only; always include text labels.

6. Mobile touch ergonomics
- Minimum target size for tap actions: ~44x44 CSS px.
- Keep destructive actions visually distinct and separated from primary actions.
- Prevent floating actions from covering core content.

7. Motion and reduced motion
- Keep animations purposeful and subtle.
- Respect reduced-motion preferences where motion is used.

## Implementation Pattern
- Build reusable primitives in `apps/shared` when they are cross-page or cross-app.
- Keep page-specific composition in `apps/pwa`.
- Preserve approved shell layout and design references in `design/final`.

## PR/Review Done Checklist
- Keyboard-only walkthrough passes for new screens.
- Visible focus states are present and consistent.
- Form labels and button accessible names are complete.
- Notices are announced and understandable by screen readers.
- Mobile tap targets and spacing are practical on small screens.
- No critical contrast regressions introduced.
