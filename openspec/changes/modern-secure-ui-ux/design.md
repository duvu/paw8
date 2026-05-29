## Context

The repository already has implemented web and mobile clients, but the current experience still shows several rough edges that affect both usability and security-sensitive workflows.

Current state visible in code:

- `apps/web/app/page.tsx` is still the default starter page rather than a branded entry surface.
- `apps/web/contexts/auth.tsx` expects `/auth/login` to return `access_token`, while the backend returns `accessToken`.
- `apps/web/app/(dashboard)/reports/page.tsx` calls stale routes such as `/reports/by-store`, `/reports/by-staff`, and `/reports/inventory`.
- `apps/web/app/(dashboard)/audit-logs/page.tsx` calls `/audit-logs`, while the backend exposes `/audit/logs`.
- `apps/mobile/lib/features/auth/data/auth_repository.dart` also expects `access_token` rather than `accessToken`.
- `apps/mobile/lib/features/home/screens/home_screen.dart` still contains hardcoded English labels and a partly unfinished profile/navigation experience.

The goal of this change is to modernize the UI/UX while tightening the frontend contract around the current backend implementation. This is intentionally a product-surface change, not a backend architecture rewrite.

## Goals / Non-Goals

**Goals:**
- Deliver a more modern, cohesive visual experience across the web and mobile apps.
- Make security-sensitive UI flows explicit and reliable: login, logout, expired session handling, protected-route behavior, and restricted navigation.
- Align web and mobile clients with the currently implemented backend auth, report, audit, and dashboard contracts.
- Establish reusable UI patterns and copy rules so future changes stay consistent.
- Ensure refreshed user-facing copy is polished and avoids scaffold or planning-era wording.

**Non-Goals:**
- Replacing the backend auth architecture with cookie-based sessions.
- Redesigning domain workflows or adding new business modules.
- Reworking the database schema.
- Introducing a heavy external design system framework.
- Solving every existing frontend issue outside the refreshed surfaces covered by this change.

## Decisions

### D1: Frontends align to the current backend contract first

This change will adapt the web and mobile clients to the backend that is already implemented, rather than changing backend response names or adding alias routes as a first step. This keeps the change tightly focused on reliable UI/UX delivery and avoids turning it into an API redesign.

Alternative considered:
- Add compatibility aliases in the backend for snake_case tokens and stale report routes. Rejected for this change because it preserves incorrect client assumptions instead of fixing them.

### D2: Use lightweight, in-stack UI foundations instead of adding a new design framework

The web app should build reusable primitives and layout/state patterns using the existing Next.js and Tailwind setup. The mobile app should use shared Flutter widgets/theme patterns on top of Material. This keeps bundle complexity lower and matches the current stack.

Alternative considered:
- Introduce a third-party design system or component framework. Rejected because it adds migration cost and design overhead before the current product surface is even consistent.

### D3: Refresh the highest-visibility, highest-risk surfaces first

Implementation should prioritize:

- web root entry
- web login
- web authenticated shell
- reports and audit pages
- mobile login
- mobile home/profile/settings/navigation

These surfaces define first impressions, session trust, and day-to-day operational usability.

Alternative considered:
- Attempt a blanket visual rewrite of every screen at once. Rejected because it increases risk and slows verification.

### D4: Security UX should be explicit even if the auth storage model remains unchanged

The current web app uses local storage and the mobile app uses secure storage. This change will keep those mechanisms for scope control, but it will improve the surrounding UX: token parsing, logout, expired-session handling, route protection, role-aware navigation, and clear failure states.

Alternative considered:
- Move the web app to a new cookie/session architecture as part of the refresh. Rejected because that deserves its own dedicated auth change.

### D5: Refreshed copy must be production-ready and localization-aware

Any refreshed surface must use clean operational copy, rely on the existing localization infrastructure where available, and remove placeholder or unfinished wording. The change should also reduce hardcoded English strings in the mobile app.

Alternative considered:
- Focus only on visual polish and defer copy cleanup. Rejected because inconsistent copy undermines trust as much as uneven visuals.

### D6: Reports, audit, and dashboard screens should use the backend as the source of truth

The implementation should update screen routing and response mapping to the actual controller paths and response fields that exist today. This is especially important for reports, audit logs, auth responses, and dashboard cards.

Alternative considered:
- Preserve current UI routing assumptions and wait for backend convergence. Rejected because the current mismatches already break the experience.

## Risks / Trade-offs

- [Risk] A partial UI refresh could make untouched screens feel older by comparison -> Mitigation: establish shared patterns first and apply them to the highest-traffic surfaces.
- [Risk] Aligning to current backend contracts could lock in naming that may change later -> Mitigation: isolate response parsing and route constants so a later backend refactor is cheaper.
- [Risk] Security UX can improve while storage-level risk remains on web local storage -> Mitigation: document this explicitly and keep auth model changes as a separate future concern.
- [Risk] Mobile and web parity may drift if copy/state handling is implemented differently -> Mitigation: define capability-level requirements around session handling, feedback states, and polished copy.
- [Risk] Dashboard/report screens may reveal additional backend field mismatches during implementation -> Mitigation: verify each high-risk screen against current controllers and responses before finalizing the UI.

## Migration Plan

1. Implement reusable UI/state foundations in web and mobile.
2. Refresh entry, login, shell, and high-risk operational screens.
3. Align auth/session parsing and route usage with the backend contract.
4. Update localization content for refreshed surfaces.
5. Verify builds and session/report/audit behavior.

Rollback strategy:

- Revert the frontend changes in `apps/web` and `apps/mobile` if regressions are found.
- No database rollback is needed.

## Open Questions

- Should a future change move the web app from local storage tokens to an HTTP-only cookie model?
- Should the refresh introduce a dark theme, or keep a single polished light theme first?
- Should unfinished mobile entry points such as asset upload be wired into navigation now or removed from the visible journey until complete?
