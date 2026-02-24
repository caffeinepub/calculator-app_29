# Specification

## Summary
**Goal:** Build a simple calculator app with a Motoko backend actor and a modern dark-themed frontend UI.

**Planned changes:**
- Implement a backend Motoko actor exposing `add`, `subtract`, `multiply`, and `divide` functions, with divide-by-zero returning an error
- Build a calculator UI with a numeric display, digit buttons (0–9), decimal point, operator buttons (+, −, ×, ÷), equals, and clear/reset
- Connect operator and equals buttons to the backend actor calls
- Display division-by-zero error message on screen
- Apply a dark charcoal background, white display text, accent-colored operator buttons, card-style centered layout, and clean sans-serif typography

**User-visible outcome:** Users can perform basic arithmetic (add, subtract, multiply, divide) through a visually polished calculator centered on the page, with proper error handling for division by zero.
