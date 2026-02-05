# Palette's Journal - Critical Learnings

## 2024-07-25 - Solid Colors Feel More "Human"

**Learning:** User feedback indicated that gradient-based UI elements, especially for primary actions, can feel "AI-generated" and less trustworthy. A switch to a solid color was perceived as more grounded and intentionally designed.

**Action:** When evaluating designs, be mindful of gradients in key interactive elements. Prioritize solid colors for actions that require user trust, such as "Sign In" or "Purchase," unless a gradient is a core, intentional part of the brand identity.

## 2025-05-15 - Overlay Accessibility with :focus-within

**Learning:** Hover-only overlays (like those on photo cards) are inaccessible to keyboard users unless explicitly triggered by focus. Using `:focus-within` in CSS allows the overlay to appear when the card or any of its children (like zoom buttons) are focused, ensuring a consistent experience between mouse and keyboard users.

**Action:** When implementing hover overlays for interactive elements, always include a `:focus-within` state to ensure information or actions remain accessible to all users.
