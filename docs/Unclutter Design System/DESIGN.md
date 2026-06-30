# Unclutter Design System

## 1. Color
Unclutter uses a warm-neutral foundation with one accent per app.

### Core Tokens
- `--brand-gold`: `#ffce0a`
- `--charcoal`: `#2b2827`
- `--bg-app`: `#FDFCF8`
- `--bg-card`: `#ffffff`
- `--bg-muted`: `#f2f4f3`
- `--border`: `hsl(20 5% 90%)`

### Semantic Tokens
- `--primary`: app accent
- `--primary-foreground`: contrast text on accent
- `--secondary`: charcoal by default, estate dark teal override
- `--ring`: same as app accent
- Status: `--success #2d8a35`, `--warning #b7791f`, `--error #ba1a1a`

### App Accent Map
- Main/Journal: `#ffce0a` (Amber Gold)
- Finance: `#10b981` (Emerald)
- Estate: `#2f9f45` (Forest) + `#041920` (Dark Teal secondary)
- Consult: `#0b3a53` (Ocean Navy)
- Learning: `#6366f1` (Indigo)

## 2. Typography
### Families
- Primary: `Outfit` (variable, 100-900) across the suite.
- Data utility only: `Manrope` for dense numeric/tabular views.
- Mono utility: `JetBrains Mono` fallback stack.

### Scale
- `--text-xs 10px` through `--text-4xl 32px`
- `--text-hero 37.6px`

### Signature Type Behavior
- Eyebrow labels: uppercase, wide tracking (`0.2em`), strong weight.
- Headings: tight tracking (`-0.04em` to `-0.06em`), personal/warm tone.
- Body: short, clear, calm phrasing.

## 3. Spacing
### Radius
- Base: `--radius` (`1.5rem` Journal/Main, `1rem` other apps)
- Scale: `sm`, `md`, `lg`, `xl`, `2xl`, `full`

### Space
- Token scale: `--space-1` to `--space-16` (`4px` to `64px`)
- Typical page padding: `24-32px`
- Typical card padding: `20-32px`

### Shadows
- Subtle ramp from `--shadow-xs` to `--shadow-modal`
- Hero shadow: `--shadow-hero`
- Nav shadow: `--shadow-nav`

## 4. Layout
- Warm off-white app canvas with white rounded cards.
- Tonal layering over hard separators.
- Floating frosted bottom nav patterns for mobile.
- Estate may use deeper, high-contrast sections for utility-heavy screens.
- Use generous whitespace and breathing room instead of dense boxing.

## 5. Components
### Cards
- Default: white, soft border, large radius, soft shadow.
- Hero variant: dark charcoal surface with light text.

### Buttons
- Rounded (`xl`/`2xl`) with gentle hover/press feedback.
- Primary button uses app accent; clear foreground contrast required.

### Inputs
- Rounded, soft-fill fields (`bg-muted` family), minimal chrome.
- Focus ring must use app `--ring` token.

### Navigation
- Bottom navigation uses frosted glass and clear active pill state.

### Iconography
- Lucide, stroke-based, rounded caps/joins, no icon-font dependency.

## 6. Motion
- Framer Motion style: calm, short, non-bouncy transitions.
- Entry: fade + slight translate (`y: 20 -> 0`) with subtle stagger.
- Hover: slight lift or small scale-up.
- Press: slight scale-down (`0.98-0.99`).
- Easing: prefer `ease-out` / `easeOut`.

## 7. Voice
- Tone: warm, introspective, gently encouraging.
- Address users directly (`you`, `your`).
- Keep copy concise; avoid robotic or technical phrasing.
- Empty/error states should feel supportive, never punitive.

## 8. Brand
Unclutter is a six-app productivity suite with shared visual DNA and per-app accents:
- Main/Journal, Finance, Estate, Consult, Learning, Main mobile.

Brand traits:
- Calm clarity over maximalism.
- Rounded, soft, approachable surfaces.
- Minimal photography in core product UI; rely on iconography and color blocks.

## 9. Anti-Patterns
- Do not use harsh black-on-white defaults.
- Do not use heavy borders as primary structure.
- Do not use bouncy/springy motion for core workflows.
- Do not over-compress layouts; preserve whitespace.
- Do not break accent mapping between apps.
- Do not switch away from Outfit for primary UI typography.
