# Palette's UX Journal

## 2025-05-15 - Accessibility for Card-based UI
**Learning:** In a vanilla JS SPA that uses HTML strings for rendering, interactive card-like `div` elements are often missed in keyboard navigation. Simply adding `tabindex="0"` is not enough; you must also provide an `onkeydown` handler to allow activation via 'Enter' or 'Space', as `div`s do not have default click-on-keypress behavior like `button` or `a` tags.
**Action:** Always pair `tabindex="0"` with `onkeydown="if(['Enter',' '].includes(event.key)){this.click();event.preventDefault();}"` for non-semantic interactive elements.

## 2025-05-15 - Icon-only Button Labels
**Learning:** Icon-only buttons (zoom, navigation, delete) are completely inaccessible to screen reader users if they lack `aria-label`. In this project, many SVG-based buttons had no text content.
**Action:** Audit SVG icons and ensure any button containing only an SVG has a descriptive `aria-label`.
