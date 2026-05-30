## ADDED Requirements

### Requirement: Login with email and password
The system SHALL authenticate users with email/password and return a signed JWT. The JWT payload SHALL include `sub` (userId), `tenantId`, `role`, and `allowedStoreIds`.

#### Scenario: Successful login
- **WHEN** a user submits valid email and password to `POST /api/v1/auth/login`
- **THEN** the system returns HTTP 200 with `{ accessToken, refreshToken, expiresIn }`

#### Scenario: Invalid credentials
- **WHEN** a user submits wrong password
- **THEN** the system returns HTTP 401 with error `INVALID_CREDENTIALS`

#### Scenario: Locked account login attempt
- **WHEN** a user with `status=locked` attempts login
- **THEN** the system returns HTTP 403 with error `ACCOUNT_LOCKED`

### Requirement: Tenant resolution from JWT only
The system SHALL derive `tenantId` exclusively from the JWT payload. The system SHALL NOT accept `tenant_id` from request body, query parameters, or headers.

#### Scenario: Request with valid JWT
- **WHEN** a protected endpoint receives a request with a valid JWT
- **THEN** the system resolves `currentUser.tenantId` from the token and applies it to all queries

#### Scenario: Request with tenant_id in body
- **WHEN** a request includes `tenant_id` in the JSON body
- **THEN** the system ignores it and uses only the JWT-derived tenant

### Requirement: Token refresh
The system SHALL issue a new `accessToken` given a valid `refreshToken`.

#### Scenario: Valid refresh token
- **WHEN** `POST /api/v1/auth/refresh` is called with a valid, unexpired refresh token
- **THEN** the system returns a new `accessToken`

#### Scenario: Expired refresh token
- **WHEN** the refresh token is expired
- **THEN** the system returns HTTP 401 and the user must re-login

### Requirement: Logout
The system SHALL invalidate the user's refresh token on logout.

#### Scenario: Logout
- **WHEN** `POST /api/v1/auth/logout` is called with a valid access token
- **THEN** the refresh token is revoked and subsequent refresh attempts return 401

### Requirement: Change password
The system SHALL allow authenticated users to change their own password.

#### Scenario: Successful password change
- **WHEN** `POST /api/v1/auth/change-password` is called with correct `currentPassword` and valid `newPassword`
- **THEN** the system updates the password hash and returns HTTP 200

#### Scenario: Wrong current password
- **WHEN** `currentPassword` does not match stored hash
- **THEN** the system returns HTTP 400 with error `WRONG_CURRENT_PASSWORD`
