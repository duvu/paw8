## ADDED Requirements

### Requirement: Design token definition
The project SHALL define all visual design tokens as CSS custom properties inside a Tailwind v4 `@theme` block in `apps/web/app/globals.css`. Tokens SHALL cover: primary color scale (50–900 in indigo), neutral scale (50–900 in slate), semantic colors (background, foreground, surface, border, muted, destructive, success, warning), border radius (sm, md, lg, xl, full), font families (sans, mono), and font size scale (xs, sm, base, lg, xl, 2xl, 3xl).

#### Scenario: Primary button renders in brand color
- **WHEN** a component uses `bg-primary-600` Tailwind utility
- **THEN** it renders with the defined `--color-primary-600` value (`#4f46e5` or equivalent indigo)

#### Scenario: Tokens available across all components
- **WHEN** any `components/ui/` file references a design-token utility class
- **THEN** Tailwind resolves it from the `@theme` block without additional config

### Requirement: `cn()` class composition utility
The project SHALL provide a `cn(...inputs)` utility at `apps/web/lib/cn.ts` that combines `clsx` and `tailwind-merge` to safely merge Tailwind utility classes.

#### Scenario: Conflicting classes resolved
- **WHEN** `cn('bg-red-500', 'bg-blue-500')` is called
- **THEN** the result contains only `bg-blue-500` (last wins via tailwind-merge)

### Requirement: Responsive base typography
Body text SHALL use a system font stack with Tailwind `font-sans`. Heading hierarchy (h1–h4) SHALL have defined size and weight tokens. Line height SHALL default to `1.6` for body copy.

#### Scenario: Consistent font rendering
- **WHEN** any page loads in the browser
- **THEN** text renders using the configured `--font-sans` variable, not a fallback browser default
