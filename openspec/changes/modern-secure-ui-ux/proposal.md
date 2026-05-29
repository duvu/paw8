## Why

The current web and mobile user experience is functional but uneven: the web root route is still a starter page, core screens use inconsistent layouts, and several security-sensitive frontend flows are out of sync with the implemented backend contract. This is the right time to establish a modern, maintainable, security-conscious UI/UX foundation that matches the real API and removes placeholder or planning-era language from user-facing surfaces.

## What Changes

- Replace the placeholder web entry page with a branded product entry experience and a clearer sign-in path.
- Refresh the web login flow, authenticated shell, navigation, forms, filters, tables, and operational feedback states.
- Align web and mobile auth/session handling with the current backend response contract and route structure.
- Improve role-aware navigation, logout behavior, expired-session handling, and restricted-access feedback.
- Refresh the mobile login, home, profile, settings, and navigation experience.
- Complete copy cleanup for refreshed surfaces so user-facing text is polished, localized where supported, and free of scaffold or planning terminology.
- Establish reusable UI patterns that make future screen updates more consistent and easier to maintain.

## Capabilities

### New Capabilities
- `ui-foundation`: reusable visual patterns, feedback states, and copy rules for refreshed screens.
- `web-secure-experience`: a modern, role-aware, security-conscious web experience for entry, authentication, navigation, reports, and audit views.
- `mobile-secure-experience`: a polished, localized, security-conscious mobile experience for authentication, home, profile, settings, and navigation.
- `frontend-contract-alignment`: frontend auth, routing, and data consumption that match the currently implemented backend contracts.

### Modified Capabilities
None.

## Impact

- Affected apps: `apps/web`, `apps/mobile`
- Likely affected assets: localization message files, auth/session helpers, dashboard shell components, report/audit views, mobile navigation and home/profile/settings screens
- Possible supporting changes: shared frontend utilities for response parsing and UI state handling
- No database schema changes are expected
- No new backend domain capability is required unless compatibility helpers are needed during implementation
