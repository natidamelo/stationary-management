# shadcn/ui Component Foundation — Stationery Management System

## Design Tokens & Architecture

All UI components in this application are built on top of **shadcn/ui primitives** (powered by Tailwind CSS v4 and Radix UI).

### Key Rules & Guidelines

1. **Zero Hardcoded Colors**: Never use raw hex/rgb values (e.g. `#6366f1` or `rgb(15,23,42)`). Always use semantic CSS variable tokens:
   - `bg-background` / `text-foreground`
   - `bg-card` / `text-card-foreground`
   - `bg-primary` / `text-primary-foreground`
   - `bg-secondary` / `text-secondary-foreground`
   - `bg-accent` / `text-accent-foreground`
   - `bg-muted` / `text-muted-foreground`
   - `bg-destructive` / `text-destructive-foreground`
   - `bg-success` / `text-success-foreground`
   - `bg-warning` / `text-warning-foreground`
   - `border-border` / `ring-ring`

2. **Dark Mode Integration**:
   - The theme is driven by `next-themes` via `ThemeProvider`.
   - Dark mode is controlled via the `.dark` class on the `<html>` element.
   - All color CSS variables switch automatically when toggling light/dark mode in `src/index.css`.

3. **Icon System**:
   - Use `lucide-react` icons for all UI components.
   - Do NOT import `@mui/icons-material`.

4. **Form Pattern**:
   - Use `react-hook-form` + `zod` schema validation + `shadcn` input components.
   - Use `sonner` (`toast.success()`, `toast.error()`) for notification alerts.

5. **Component Primitives (`/src/components/ui`)**:
   - `button.tsx` — Button variants (default, destructive, outline, secondary, ghost, link, success, warning)
   - `input.tsx` — Text, number, email, password inputs
   - `select.tsx` — Dropdown select primitive
   - `dialog.tsx` — Modal dialogs and drawers
   - `card.tsx` — Container cards
   - `table.tsx` — Data tables
   - `tabs.tsx` — Tabbed navigation views
   - `badge.tsx` — Status tags and pills
   - `sonner.tsx` — Toast container
   - `dropdown-menu.tsx` — Context menus & popovers
   - `label.tsx` — Form field labels
   - `separator.tsx` — Divider lines
   - `avatar.tsx` — User avatars
   - `switch.tsx` — Toggle switches
   - `progress.tsx` — Progress bars
