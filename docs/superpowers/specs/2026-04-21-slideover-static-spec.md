# Slide-over Static Panel Specification

> **Feature:** Make slide-over panels static on screen with internal scrolling.

**Goal:** Slide-over panels should stay fixed below the top banner, not scroll with the page, and have their own internal scrolling for content.

---

## Background

**Current State:**
- Panel uses `fixed inset-0` (full viewport)
- `h-screen` causes content to be hidden or cut off
- Content scrolls with page instead of internally
- Fixed to entire viewport including top banner

**Desired Behavior:**
- Panel fixed below top banner (offset from top)
- Internal scrolling for panel content only
- Panel does not move when page scrolls

---

## Requirements

### 1. Static Positioning
- Panel container: `fixed inset-y-0 right-0` (removed `inset-0`, inset-y anchors to viewport edges)
- Position below top banner: Add `top-16` (64px - typical top bar height)
- Alternatively: Use `bottom-0` instead of `inset-y-0`

### 2. Internal Scrolling
- Outer wrapper: `flex flex-col h-full`
- Content area: `flex-1 min-h-0 overflow-y-auto`
- `min-h-0` is critical - resets flexbox min-height to allow shrinking

### 3. Consistent Layout Structure
```tsx
// Root div
<div className="fixed inset-y-0 right-0 w-full max-w-2xl flex flex-col bg-white shadow-xl">

  {/* Header - fixed height */}
  <div className="shrink-0 border-b px-6 py-4">
    {/* Title + Close button */}
  </div>

  {/* Content - scrolls internally */}
  <div className="flex-1 min-h-0 overflow-y-auto p-6">
    {children}
  </div>

  {/* Footer - if needed */}
  <div className="shrink-0 border-t px-6 py-4">
    {/* Action buttons */}
  </div>
</div>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `apps/pwa/src/shared/components/ui/SlideOver.tsx` | Apply layout fixes |
| `apps/pwa/src/modules/hr/settings/AttendanceOverrideSlideOver.tsx` | Apply layout fixes |
| `apps/pwa/src/modules/hr/attendance/StaffAttendanceSlideOver.tsx` | Apply layout fixes |

---

## Visual Checkpoints

1. Panel appears below top banner (not overlapping)
2. Page scroll does NOT move panel
3. Panel content scrolls internally when overflow
4. Close button always visible in header
5. Footer actions always visible (if footer exists)

---

## Technical Details

- Use `bottom-0` instead of `inset-y-0` for simpler anchoring
- Add `top-16` to position below header
- Use Tailwind's `min-h-0` on flex children for proper shrink behavior
- `overflow-y-auto` enables vertical scrolling
- `h-full` on wrapper with `flex flex-col` creates proper scroll container