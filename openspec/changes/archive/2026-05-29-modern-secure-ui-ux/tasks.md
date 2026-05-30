## 1. UI Foundation

- [x] 1.1 Audit the refreshed web and mobile surfaces that need shared visual and state patterns
- [x] 1.2 Define reusable web layout and state patterns for landing, auth, dashboard, table, and detail screens
- [x] 1.3 Define reusable mobile layout and state patterns for auth, home, profile, settings, and empty/error views
- [x] 1.4 Implement shared loading, empty, error, and success state components/helpers for refreshed web screens
- [x] 1.5 Implement shared feedback and polished state handling for refreshed mobile screens
- [x] 1.6 Remove placeholder or unfinished wording from refreshed UI copy targets

## 2. Web Entry and Auth Refresh

- [x] 2.1 Replace the starter root page with a branded product entry experience
- [x] 2.2 Refresh the web login page layout, messaging, and action states
- [x] 2.3 Update the web auth context to consume the current backend auth response contract
- [x] 2.4 Ensure logout and unauthorized-session handling clear local session state safely
- [x] 2.5 Improve protected-route handling so unauthenticated users are redirected consistently

## 3. Web Shell and Operational UX

- [x] 3.1 Refresh the authenticated dashboard shell, header, and account context presentation
- [x] 3.2 Apply the refreshed UI foundation to key operational pages such as dashboard, reports, and audit logs
- [x] 3.3 Update role-aware navigation visibility for privileged routes
- [x] 3.4 Align the reports page with the implemented backend report endpoints
- [x] 3.5 Align the audit page with the implemented `/audit/logs` endpoint
- [x] 3.6 Improve table, filter, and empty/error states on refreshed web operational pages

## 4. Mobile Auth and Navigation Refresh

- [x] 4.1 Update the mobile auth repository to consume the current backend auth response contract
- [x] 4.2 Refresh the mobile login screen layout and error states
- [x] 4.3 Refresh the mobile home screen cards, labels, and primary navigation flow
- [x] 4.4 Refresh the mobile profile and settings experience
- [x] 4.5 Ensure mobile logout and missing-session routing behavior are consistent and safe
- [x] 4.6 Keep unfinished asset-photo upload outside the primary mobile journey until a complete routed flow is ready

## 5. Frontend Contract Alignment

- [x] 5.1 Align web token storage and parsing with the current backend auth response fields
- [x] 5.2 Align mobile token storage and parsing with the current backend auth response fields
- [x] 5.3 Align web report and audit requests with the implemented controller paths
- [x] 5.4 Align mobile dashboard data mapping with the implemented dashboard response fields
- [x] 5.5 Add defensive parsing and controlled failure handling for malformed auth and dashboard responses

## 6. Localization and Copy Cleanup

- [x] 6.1 Update web localization messages for the refreshed entry, auth, shell, report, and audit surfaces
- [x] 6.2 Update mobile localization resources for refreshed auth, home, profile, settings, and session copy
- [x] 6.3 Remove hardcoded strings from refreshed mobile surfaces
- [x] 6.4 Regenerate or verify localization outputs after copy updates

## 7. Verification

- [x] 7.1 Verify the web auth/session implementation now uses the backend `accessToken` contract and safely clears expired sessions
- [x] 7.2 Verify refreshed web reports and audit screens request the implemented backend routes
- [x] 7.3 Verify refreshed mobile auth/session and dashboard parsing align with the implemented backend contract
- [x] 7.4 Run `pnpm build` in `apps/web`
- [x] 7.5 Run `flutter analyze` in `apps/mobile`
- [x] 7.6 Run `pnpm i18n:check` from the repository root
- [x] 7.7 Update the change checklist to reflect completed implementation work and the remaining deliberate limitations (`/transactions` unavailable state, asset upload outside the primary mobile journey)
