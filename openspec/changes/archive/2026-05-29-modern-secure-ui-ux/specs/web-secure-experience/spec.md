## ADDED Requirements

### Requirement: Web entry and sign-in experience is modern and branded
The web application SHALL replace the placeholder root page with a branded entry experience and SHALL provide a modern sign-in flow with clear interaction states.

#### Scenario: Unauthenticated user visits root route
- **WHEN** an unauthenticated user visits `/`
- **THEN** they are shown a branded entry surface with a clear path to sign in

#### Scenario: Login attempt fails
- **WHEN** a login attempt fails
- **THEN** the sign-in screen shows a clear, localized error state without exposing raw transport details

### Requirement: Web authenticated shell is role-aware and security-conscious
The web application SHALL provide an authenticated shell with role-aware navigation, visible account context, protected-route handling, and clear logout behavior.

#### Scenario: Unauthenticated user requests a protected page
- **WHEN** a user without a valid session requests a protected route
- **THEN** the application redirects them to a safe sign-in route

#### Scenario: User lacks elevated privileges
- **WHEN** a signed-in user does not have the required role for a privileged navigation item
- **THEN** the application hides or otherwise prevents access to that privileged path in the refreshed shell

### Requirement: Web operational screens use the current backend contract
The web application SHALL use the currently implemented backend routes and response shapes for reports, audit logs, and session handling.

#### Scenario: User opens report tabs
- **WHEN** a user switches among refreshed report tabs
- **THEN** the application requests `/reports/contracts`, `/reports/collections`, `/reports/outstanding`, `/reports/overdue`, `/reports/stores`, `/reports/staff`, and `/reports/assets/inventory` as appropriate

#### Scenario: User opens audit logs
- **WHEN** a user opens the audit log screen
- **THEN** the application requests `/audit/logs`

### Requirement: Web session expiry is surfaced clearly
The web application SHALL react to expired or invalid sessions by clearing local session state and returning the user to a safe sign-in flow.

#### Scenario: Protected API call returns unauthorized
- **WHEN** a protected web request receives an unauthorized response
- **THEN** the application clears the local session token and routes the user back to sign in with clear session-state handling
