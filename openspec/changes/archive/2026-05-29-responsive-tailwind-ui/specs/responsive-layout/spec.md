## ADDED Requirements

### Requirement: Responsive dashboard shell
The authenticated shell (`app/(dashboard)/layout.tsx`) SHALL render a fixed `264px` sidebar on screens ≥1024px and a bottom tab bar on screens <1024px. The main content area SHALL use `lg:pl-66 pb-16 lg:pb-0` to avoid overlap with the bottom nav.

#### Scenario: Sidebar visible on desktop
- **WHEN** viewport is ≥1024px
- **THEN** the sidebar navigation is visible on the left and main content is not obscured by it

#### Scenario: Bottom nav visible on mobile
- **WHEN** viewport is <1024px
- **THEN** a bottom tab bar is fixed to the bottom of the viewport; the sidebar is hidden

#### Scenario: Route protection unchanged
- **WHEN** unauthenticated user navigates to any `/dashboard` route
- **THEN** they are redirected to `/login` (same behavior as before)

### Requirement: Responsive landing page
`app/page.tsx` SHALL render a full-width responsive layout with a hero section and feature cards. On mobile the layout is single-column; on tablet/desktop it uses a 2-column split layout.

#### Scenario: Hero is readable on mobile
- **WHEN** viewport is 375px wide
- **THEN** hero title and CTA buttons are fully visible without horizontal scroll

### Requirement: Responsive login page
`app/login/page.tsx` SHALL use a centered single-card layout on all screen sizes. On desktop the card is constrained to `max-w-md`.

#### Scenario: Login form usable on mobile
- **WHEN** viewport is 375px wide
- **THEN** email input, password input, and sign-in button are all visible without scrolling

### Requirement: Bottom navigation items
The mobile bottom nav SHALL show icons + labels for the 4–5 most-used destinations: Dashboard, Customers, Contracts, Reports, and a "More" menu item that leads to Users/Stores/Audit when tapped. Items SHALL highlight the active route.

#### Scenario: Active route highlighted in bottom nav
- **WHEN** user is on `/contracts`
- **THEN** the Contracts tab item is visually active (filled icon, distinct color)
