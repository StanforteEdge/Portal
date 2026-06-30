# Unclutter Design System

> A shared visual language for the Unclutter productivity suite — 6 PWAs, one coherent identity.

---

## What Is Unclutter?

Unclutter is a personal productivity and life-management platform built as a suite of 6 specialized Progressive Web Apps (PWAs). All apps share a common design language, token system, and component library (`@unclutter/ui`), but each carries its own brand accent color — much like Google Workspace or Microsoft 365.

**Domain:** unclutter.com.ng  
**Backend:** NestJS + Prisma + PostgreSQL (single shared API)  
**Frontend:** React + Vite + Tailwind CSS (per-app PWAs, monorepo)  
**Shared packages:** `@unclutter/ui` (components), `@unclutter/shared` (services, constants, types)

---

## The Six Apps

| App | Purpose | Brand Color |
|-----|---------|-------------|
| **Main / Journal** | Hub + journaling, mood check-ins, community wall | Amber Gold `#ffce0a` |
| **Finance** | Multi-account tracking: budgets, goals, transactions, reports | Emerald Green `#10b981` |
| **Estate** | Property management: units, occupants, meters, analytics | Forest Green `#2f9f45` / Dark Teal `#041920` |
| **Consult** | Consultation booking: calendar, sessions, reports | Rose `#f43f5e` |
| **Learning** | LMS: calendar, content, charts, data tables | Indigo `#6366f1` |
| **Main (Mobile)** | React Native companion app (Expo) | Amber Gold |

---

## Sources

- **Journal codebase:** Attached local folder `journal/` — full PWA source at `journal/pwa/`
- **Monorepo (GitHub):** `github.com/edgdmedia/unclutter` (ref: `5edfbfc07945`) — contains Finance, Estate, Learning, Main mobile, and shared packages
- **Logo:** `uploads/logo-full.svg` (copied to `assets/logo-full.svg`)

---

## Content Fundamentals

### Voice & Tone
Unclutter speaks like a wise, calm friend — not a productivity tool. The tone is **warm, introspective, and gently encouraging**. It never lectures or pressures.

- **Person:** Second person ("you", "your") — always talking *to* the user, never about them
- **Casing:** Sentence case for body text; **ALL CAPS with wide tracking** for labels, eyebrows, badges
- **Punctuation:** Full stops on standalone sentences. Fragments and ellipses used intentionally for softness ("A quiet space to check in with yourself.")
- **Emoji:** Used sparingly and intentionally — 🌿 for completion/peace, no generic decorative emoji
- **Length:** Short. One sentence beats a paragraph. "Write when you can. Even one sentence is enough."

### Copy Patterns
- **Eyebrow labels:** `10px font-black uppercase tracking-[0.2em]` — e.g. "YOUR SANCTUARY", "RECOMMENDED"
- **Headings:** Bold, personal, poetic — "A Peaceful Space." / "Welcome Back." / "Good morning."
- **Microcopy:** Italic, subdued — "Start with one sentence" / "A quiet space to check in with yourself."
- **CTAs:** Active but gentle — "Start something new", "I'm done for now", "Continue reflection"
- **Empty states:** Inviting, never negative — "Expansion Required" / "Start with one sentence"
- **Error messages:** Human, not technical — "An unexpected error occurred. Please try again."

### Specific Examples
- Greeting: *"Good morning, [Name]"* with time-of-day variants (Sun/Moon/Coffee icons)
- Streak: *"3 Day Rhythm"* (not "3 day streak")
- Journals called "Sanctuaries"; entries called "Reflections"  
- Sharing: *"A quiet moment from Unclutter"*
- Date labels: *"Last time you reflected…"* — never "Previous entry"

---

## Visual Foundations

### Color System

**Base Brand (all apps share these)**
- `--brand-gold: #ffce0a` — primary highlight, interactive, logo fill
- `--charcoal: #2b2827` — primary text/dark surfaces
- `--warm-off-white: #FDFCF8` — app background

**Per-App Accent Colors** (applied to logo + primary tokens)
- Journal/Main: `#ffce0a` amber gold
- Finance: `#10b981` emerald
- Estate: `#2f9f45` forest green / `#041920` dark teal bg
- Consult: `#f43f5e` rose
- Learning: `#6366f1` indigo

**Semantic tokens (shadcn/Tailwind CSS vars)**
- `--primary`: App accent (varies per app)
- `--secondary`: `#2b2827` charcoal
- `--background`: `#FDFCF8` or `hsl(40 40% 98%)`
- `--muted`: Light grey surfaces
- `--border`: Very subtle `hsl(20 5% 90%)`

### Typography

| Role | Font | Weights | Notes |
|------|------|---------|-------|
| Journal / Main | **Outfit** | 300–700 | Google Fonts |
| Estate | **Manrope** | 400–800 | Google Fonts |
| Finance | **Outfit** (inferred) | 400–700 | Same as Journal |
| Learning | **Roboto** | 400–700 | Bundled locally |

**Type Scale Patterns:**
- Hero headings: `text-3xl font-bold tracking-tight` (Journal) / `text-[2rem] font-extrabold tracking-[-0.04em]` (Estate)
- Labels/eyebrows: `text-[10px] font-black uppercase tracking-[0.2em–0.3em]` 
- Body: `text-sm` / `text-base`, subdued color (`text-secondary/50`)
- Stat values: `text-3xl font-light` (Finance) / `text-[1.45rem] font-extrabold tracking-[-0.04em]` (Estate)

### Spacing & Radius

- **Global radius:** `1.5rem` (Journal) / `1rem` (Estate) — set as `--radius` CSS var
- **Cards:** `rounded-2xl` (24px) to `rounded-[2.5rem]` (40px) — generous
- **Hero cards / CTA:** `rounded-[2.5rem]` to `rounded-[3rem]`
- **Buttons:** `rounded-xl` to `rounded-2xl`
- **Tags/Badges:** `rounded-full` (pill)
- **Page padding:** `px-6` / `px-8`, `pt-10`
- **Card padding:** `p-5` to `p-8`

### Backgrounds & Surfaces

- **App bg:** `#FDFCF8` — warm off-white, not pure white
- **Cards:** Pure `white` with `border border-secondary/5` or `/10` — almost invisible border
- **Muted surfaces:** `bg-secondary/5` (5% charcoal)
- **Dark hero card:** `bg-secondary` charcoal (`#2b2827`) with `shadow-2xl shadow-secondary/20`
- **Estate dark card:** `linear-gradient(145deg, #041920, #15333d)` with `box-shadow: 0 25px 44px rgba(0,0,0,0.25)`
- **Estate splash:** `bg-[#1a2e35]` with radial glow (`rgba(160,243,153,0.95)`)
- **Backdrop blur:** Used for nav bars, modals, sticky headers — `backdrop-blur-xl bg-white/85`

### Shadows

- Cards: `shadow-sm` (subtle) → `shadow-xl` on hover
- Hero CTA: `shadow-2xl shadow-secondary/20`
- Estate dark card: `0 25px 44px rgba(0,0,0,0.25)`
- Estate nav: `0 -4px 20px rgba(0,0,0,0.04)`
- Modal: `0 24px 80px rgba(15,23,42,0.24)`
- Stat items: `0 12px 34px rgba(15,23,42,0.06)`

### Animation & Motion

- **Library:** Framer Motion (`motion/react`)
- **Entry:** `initial: {opacity:0, y:20}` → `animate: {opacity:1, y:0}` with staggered `delay: idx * 0.05`
- **Page transitions:** `x:20` slide-in, `x:-20` slide-out (`AnimatePresence mode="wait"`)
- **Hover:** `whileHover: {scale: 1.02}` or `whileHover: {y: -2}` — subtle lifts
- **Press:** `whileTap: {scale: 0.98}` 
- **CSS animations:** `fade-in 0.5s ease-out`, `slide-up 0.5s ease-out`
- **Accordion:** `ease-out 0.2s`
- **Icon rotation on hover:** Journal card icons rotate 6° on hover (`group-hover:rotate-6 duration-500`)
- **Decorative corner expand:** Absolute positioned accent corner scales on hover (`group-hover:scale-110 duration-700`)
- **No bounces** — all easing is `ease-out` or `easeOut`, smooth and calm

### Interactive States

- **Hover (cards):** `-translate-y-1`, `shadow-xl`, optional text color to primary
- **Hover (buttons):** Slightly brighter/darker bg, optional shadow
- **Press:** `scale: 0.98–0.99`
- **Active nav item:** `bg-[#041920] text-white` (Estate) / `bg-secondary text-white` (Journal)
- **Focus:** Ring uses `--ring` = primary color
- **Disabled:** `opacity-60`
- **"Calm mode" (Finance):** Numbers blurred with `blur-md opacity-50 select-none`

### Cards

Cards are **white, highly rounded, softly shadowed, with near-invisible borders**:
```
bg-white rounded-[2rem] p-6 shadow-sm border border-secondary/5
```
Dark variant (hero CTA):
```
bg-secondary text-white rounded-[2.5rem] p-8 shadow-2xl shadow-secondary/20
```
Finance stat card:
```
bg-white/70 backdrop-blur-md rounded-2xl border-none shadow-sm
```

### Bottom Navigation

Both Journal and Estate use a **floating frosted-glass bottom nav**:
- `backdrop-blur-xl bg-white/85`
- Rounded top: `rounded-t-[24px]`
- Active tab: pill bg `bg-secondary` (charcoal) with white text — no icon-only treatment
- Estate: 5-tab grid; Journal: 4-tab with "more" menu

### Imagery & Illustration

- **No photographic images** in app UI — icons and color blocks only
- **Decorative motif:** Large ghost icon at `opacity-[0.03]` in card corners, scales on hover
- **Estate grid bg:** Subtle CSS grid lines on onboarding hero cards
- **Radial glow:** Used in Estate splash screen — green radial gradient with `filter: blur(14px)`
- **No gradients in main UI** — gradients reserved for splash/loading screens

### Corner Radii Summary

| Element | Radius |
|---------|--------|
| App shell (desktop) | `rounded-[3rem]` |
| Hero CTA cards | `rounded-[2.5rem]` |
| Standard cards | `rounded-[2rem]` |
| List item cards | `rounded-[2rem]` to `rounded-[2.5rem]` |
| Buttons | `rounded-xl` to `rounded-2xl` |
| Badges/tags | `rounded-full` |
| Icon containers | `rounded-2xl` |
| Inputs | `rounded-2xl` (Journal) / `rounded-2xl bg-[#f3f4f5]` (Estate) |

---

## Iconography

- **Primary icon library:** [Lucide React](https://lucide.dev) — used across all apps
- **Style:** Stroke-based, 2px stroke weight, rounded caps/joins
- **Sizes:** `w-4 h-4` (small/inline), `w-5 h-5` / `w-6 h-6` (nav/buttons), `w-8 h-8` (card icons)
- **Color:** Usually `text-primary` (accent), `text-secondary` (charcoal), or `text-muted-foreground`
- **No custom icon font** — Lucide via npm only
- **Logo icon:** Custom SVG lotus (2 petal paths + stem), defined inline as React component
- **Emotion icons:** Custom `EmotionIcon` React component — SVG-based mood illustrations
- **No emoji as functional icons** (only 🌿 used as decorative flourish in copy)

---

## File Index

```
/
├── README.md                    ← This file (start here)
├── SKILL.md                     ← Agent skill definition for Claude Code
├── colors_and_type.css          ← CSS custom properties: colors, type, tokens, per-app overrides
├── assets/
│   └── logo-full.svg            ← Lotus logo SVG (two petals + stem, amber fill)
├── preview/                     ← Design System tab cards (registered assets)
│   ├── brand-colors.html        ← Base brand palette + per-app accent swatches
│   ├── semantic-colors.html     ← Semantic token roles (primary, secondary, muted…)
│   ├── type-scale.html          ← Full type scale: hero → eyebrow
│   ├── type-labels.html         ← Eyebrow+heading combos + badge/tag patterns
│   ├── spacing-radius.html      ← Border radius scale + spacing bar scale
│   ├── shadow-elevation.html    ← Shadow ramp: flat → modal
│   ├── cards.html               ← Standard, hero, estate dark, stat, dashed cards
│   ├── buttons.html             ← All button variants and states
│   ├── inputs.html              ← Text inputs, icon inputs, segment controls, textarea
│   ├── bottom-nav.html          ← Journal 4-tab + Estate 5-tab frosted-glass navbars
│   └── logo-variants.html       ← Lotus mark at all sizes + per-app color treatments
└── ui_kits/
    ├── main/index.html          ← Main Hub: Login → App grid (links all 5 apps)
    ├── journal/index.html       ← Journal PWA: Login → Home → Journal list → Check-in
    ├── finance/index.html       ← Finance PWA: Login → Dashboard → Goals (+ calm mode)
    ├── estate/index.html        ← Estate PWA: Splash login → Dashboard → Units → Meters
    ├── consult/index.html       ← Consult PWA: Home → Calendar booking with slots
    └── learning/index.html      ← Learning PWA: Dashboard with course progress rings
```

### How to use this design system

- **Prototyping:** Import `colors_and_type.css` into any HTML file. Add `data-app="estate"` (or `finance`, `consult`, `learning`, `main`) to the `<html>` element to activate per-app tokens.
- **Component reference:** Open any `ui_kits/*/index.html` to interact with the app as a click-through prototype.
- **Token reference:** See `colors_and_type.css` for all CSS custom properties.
- **Logo:** Copy `assets/logo-full.svg` and recolor the stroke/fill to match the target app's accent color.
- **Icons:** Use [Lucide React](https://lucide.dev) — stroke-based, 2px weight, rounded caps. No custom icon font.
- **Fonts:** `Outfit` (Journal, Finance, Consult, Main) and `Manrope` (Estate) — both from Google Fonts.
