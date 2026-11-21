# Accessibility (WCAG 2.2 AA target)

- Skip link and landmark regions (`header`, `nav`, `main`, `footer`); one `h1` per view.
- Every form control has a visible `<label>`; required fields marked; errors announced via `role="alert"`.
- AI triage results and list counts announced through `aria-live` regions.
- Issue details use the native `<dialog>` (focus trap, Esc to close, labelled by its heading).
- Status and priority are always shown as text, never colour alone; charts have text values and an accessible table.
- Visible `:focus-visible` ring on every interactive element; full keyboard operation.
- All GSAP / Lenis motion is disabled when `prefers-reduced-motion: reduce` is set.
- Sidebar navigation marks the current page with `aria-current="page"`.
