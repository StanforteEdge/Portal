# Mobile Requests Implementation Tweaks

These are implementation-time polish items for the approved mobile request screens.
We are not reopening Stitch for these unless a major issue appears during build.

## Reference Screens
- `design/final/requests/mobile/requests-list-mobile-final.png`
- `design/final/requests/mobile/request-type-mobile-final.png`
- `design/final/requests/mobile/request-details-mobile-final.png`

## Planned Tweaks During Coding
1. Spacing rhythm
- Slightly increase vertical spacing between major cards/sections so scan order is clearer.

2. Tap target sizing
- Ensure icon/action taps are at least 44x44 CSS px.
- Keep list-row right actions easy to hit with one thumb.

3. Status readability
- Keep status chips high-contrast and legible at mobile sizes.
- Preserve text labels; do not rely on color only.

4. New request action behavior
- Validate floating/sticky `New Request` behavior against bottom nav and safe-area insets.
- Prevent overlap with content and destructive actions.

5. Mobile copy consistency
- Keep page naming consistent (`My Requests`, `Request Details`, `New Request`) across routes, headers, and nav.

6. Progress and next-step clarity
- Ensure `Next Step` and `Nudge Reviewer` remain visible without crowding the top content.

## Escalation Rule
If a tweak changes layout meaning (not just polish), capture it in a small screenshot diff and review before shipping.
