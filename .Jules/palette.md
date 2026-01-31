# Palette's Journal - Critical Learnings

## 2024-07-25 - Solid Colors Feel More "Human"

**Learning:** User feedback indicated that gradient-based UI elements, especially for primary actions, can feel "AI-generated" and less trustworthy. A switch to a solid color was perceived as more grounded and intentionally designed.

**Action:** When evaluating designs, be mindful of gradients in key interactive elements. Prioritize solid colors for actions that require user trust, such as "Sign In" or "Purchase," unless a gradient is a core, intentional part of the brand identity.

## 2025-01-31 - Keyboard Parity for Non-Semantic Elements

**Learning:** Adding `tabindex="0"` and `role` to `div` or `span` elements makes them focusable but doesn't automatically make them interactive for keyboard users. Without `onkeydown` handlers for "Enter" and "Space", these elements remain unusable for people who don't use a mouse.

**Action:** Whenever a non-semantic element is made focusable, always implement a keyboard event listener that mirrors the `onclick` behavior.
