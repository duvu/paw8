## ADDED Requirements

### Requirement: First-party frontends align with the implemented auth contract
All first-party frontends SHALL parse and persist the current auth response contract returned by the API.

#### Scenario: Frontend receives current login response
- **WHEN** `/auth/login` returns `accessToken`, `refreshToken`, and `expiresIn`
- **THEN** the frontend establishes authenticated session state without relying on deprecated snake_case field names

#### Scenario: Frontend processes logout or session reset
- **WHEN** a logout or unauthorized-session reset occurs
- **THEN** the frontend clears the persisted access token and leaves no stale authenticated state behind

### Requirement: First-party frontends align with implemented route contracts
All first-party frontends SHALL use the currently implemented backend route paths for high-risk operational views.

#### Scenario: Frontend loads reports or audit data
- **WHEN** a frontend requests report or audit data
- **THEN** it uses the implemented controller paths rather than stale aliases

### Requirement: Contract mismatches fail safely
Frontend API layers SHALL handle malformed responses or missing required fields with recoverable error handling rather than silently entering an inconsistent state.

#### Scenario: Required auth field is missing
- **WHEN** a login response is missing the required access-token field
- **THEN** the frontend shows a recoverable error and keeps the session logged out

#### Scenario: Required route or response shape changes unexpectedly
- **WHEN** a report, audit, or dashboard request returns an unexpected response shape
- **THEN** the frontend shows a controlled error or empty state rather than rendering broken data
