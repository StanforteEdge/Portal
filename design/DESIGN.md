# Design System Specification: The Executive Architect

## 1. Overview & Creative North Star
**The Creative North Star: "Precision Hospitality"**

This design system moves away from the sterile, "boxy" nature of traditional HR portals and toward a high-end, editorial experience. It treats the staff portal not as a utility, but as a digital workspace that respects the user's focus. The system utilizes **Precision Hospitality**: a philosophy that combines the authoritative strength of corporate blue with the soft, welcoming layers of modern productivity tools.

We break the "standard template" look by leveraging intentional asymmetry—placing larger display type in non-traditional positions—and using **Tonal Layering** instead of structural lines. This creates a "breathable" interface that feels expensive, intentional, and calm.

---

## 2. Color & Atmospheric Depth
Our palette is rooted in deep, authoritative blues, balanced by a sophisticated range of neutral "surface" tones that create a sense of environment.

### The Palette (Material Scale)
*   **Primary Core:** `primary` (#00315f) for high-impact brand moments; `primary_container` (#034785) for interactive elements.
*   **Secondary Softness:** `secondary` (#286291) and `secondary_container` (#94c8fe) provide a lighter, more approachable blue for supportive UI.
*   **Status Indicators:** 
    *   **Success:** (Green) Use with `on_surface` for readability.
    *   **Warning:** (Amber) Use for urgent but non-destructive alerts.
    *   **Pending:** (Lime) A signature choice for "in-progress" work, providing a fresh contrast to the blues.
    *   **Danger:** `error` (#ba1a1a) for critical destructive actions.

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** To create a premium feel, boundaries must be defined solely through background color shifts. A `surface_container_low` section sitting on a `surface` background is sufficient to denote a change in context. Borders are a sign of a "default" UI; we use tonal transitions to define space.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of fine paper.
*   **Background:** `surface` (#f8f9ff)
*   **Level 1 (Sections):** `surface_container_low`
*   **Level 2 (Cards/Widgets):** `surface_container` or `surface_container_lowest` (White) to create a "lifted" effect.
*   **Level 3 (Popovers/Modals):** `surface_bright` with Glassmorphism.

### The "Glass & Gradient" Rule
To add "soul" to the professional blue:
*   **Floating Elements:** Use `surface_container_lowest` at 80% opacity with a `backdrop-blur` of 12px.
*   **CTAs:** Use a subtle linear gradient from `primary` (#00315f) to `primary_container` (#034785) at a 135-degree angle. This adds a microscopic sense of curvature and light that flat hex codes lack.

---

## 3. Typography: The Editorial Edge
We use a dual-font strategy to balance character with readability.

*   **Display & Headlines (Manrope):** A geometric sans-serif that feels modern and architectural. 
    *   *Usage:* Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for dashboard welcomes.
*   **Body & Labels (Inter):** A workhorse typeface designed for legibility in dense data environments.
    *   *Usage:* `body-md` (0.875rem) is the standard for staff records and portal entries.

**Hierarchy as Identity:** By pairing a `display-sm` Manrope headline with a `label-md` Inter sub-header in all-caps, we achieve a "Modern Newspaper" look that conveys authority and professional polish.

---

## 4. Elevation & Depth
In this design system, shadows are a last resort, not a default.

*   **The Layering Principle:** Achieve depth by "stacking." Place a `surface_container_lowest` (pure white) card on top of a `surface_container_low` background. The subtle shift in hex code creates a soft, natural lift.
*   **Ambient Shadows:** If a shadow is required for a floating action button or modal, use:
    *   `Shadow Blur:` 24px - 40px.
    *   `Opacity:` 4% - 6%.
    *   `Color:` Use a tinted version of `on_surface` (a deep navy tint) rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline_variant` at **15% opacity**. This creates a "suggestion" of a line that disappears into the background.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (Primary to Primary Container), `xl` roundedness (0.75rem), white text.
*   **Secondary:** `surface_container_high` fill with `on_secondary_container` text. No border.
*   **Tertiary:** Ghost style. `on_surface` text with a subtle `primary_fixed` background on hover.

### Input Fields
*   **Style:** Minimalist. Use `surface_container_low` as the field fill. 
*   **States:** On focus, transition the background to `surface_container_lowest` and add a 2px "Ghost Border" using `primary`. Avoid heavy outlines.

### Cards & Lists
*   **The Divider Prohibition:** Never use horizontal lines to separate list items. Use **vertical white space** (16px - 24px) or alternating subtle background tints.
*   **Hybrid Work Status Chips:** Use `secondary_fixed` for "Remote" and `primary_fixed` for "On-site," utilizing `full` (9999px) roundedness for a friendly, pill-shaped aesthetic.

### Additional Signature Component: The "Focus Blade"
For staff profile views, use a "Blade"—a right-aligned slide-over panel that uses Glassmorphism (`surface_bright` @ 90% opacity) to overlay the main dashboard, keeping the user in their current context while providing deep-dive HR data.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Align headings to the left while keeping action buttons floated to the far right with significant negative space between them.
*   **Use Tonal Shifts:** Always try to separate two areas using different `surface_container` tokens before reaching for a line or a shadow.
*   **Prioritize Type Scale:** Let the size of the font communicate importance, not the weight. A large, light-weight Manrope font is more premium than a small, bold Inter font.

### Don’t:
*   **Don't use 100% Black:** Never use `#000000`. Use `on_surface` (#171c22) for text to maintain the "blue-ink" sophistication.
*   **Don't "Box-In" Content:** Avoid wrapping every widget in a bordered box. Let the content breathe on the `surface` background.
*   **Don't use Standard Shadows:** Avoid the "dirty" look of high-opacity, small-blur shadows. If it looks like a "drop shadow," it’s too heavy. It should look like "ambient light."