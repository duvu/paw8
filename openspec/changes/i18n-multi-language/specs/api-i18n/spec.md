## ADDED Requirements

### Requirement: NestJS API localizes error messages based on Accept-Language header
The NestJS API SHALL inspect the `Accept-Language` request header and return error messages (validation errors, business logic errors, HTTP exceptions) in the matching locale. Supported locales: `en`, `vi`, `zh`. Default locale: `vi`.

#### Scenario: Validation error returned in Vietnamese
- **WHEN** a request with no `Accept-Language` header (or `Accept-Language: vi`) submits an invalid DTO
- **THEN** the response body contains validation error messages in Vietnamese

#### Scenario: Validation error returned in English
- **WHEN** a request with `Accept-Language: en` submits a required field as empty
- **THEN** the response body contains the English message (e.g., "This field is required")

#### Scenario: Validation error returned in Chinese
- **WHEN** a request with `Accept-Language: zh` submits an invalid email
- **THEN** the response body contains the Chinese validation message

#### Scenario: Unknown locale falls back to Vietnamese
- **WHEN** a request has `Accept-Language: fr` (unsupported)
- **THEN** the API returns error messages in Vietnamese

### Requirement: Business logic error messages are localized
Known application exceptions (invalid credentials, tenant locked, duplicate identity, contract not found, etc.) SHALL use i18n translation keys and be rendered in the request's locale.

#### Scenario: Invalid login credentials message localized
- **WHEN** a POST /auth/login request with wrong password and `Accept-Language: en` is received
- **THEN** the 401 response body contains "Invalid email or password" (English)

#### Scenario: Duplicate customer identity error localized
- **WHEN** a POST /customers request creates a customer with an existing identity_number under the same tenant with `Accept-Language: zh`
- **THEN** the 409 response body contains the Chinese message for "DUPLICATE_IDENTITY"

### Requirement: Translation files cover all API error keys
JSON translation files at `src/i18n/{en,vi,zh}.json` SHALL contain keys for every validation message and business error thrown by the API, organized under namespaces matching the module (e.g., `auth.*`, `contract.*`, `validation.*`).

#### Scenario: All validation keys present in all locales
- **WHEN** the i18n:check script compares en.json, vi.json, and zh.json
- **THEN** all three files contain identical key sets with no missing entries

#### Scenario: API starts without missing translation key warnings
- **WHEN** the NestJS app boots
- **THEN** nestjs-i18n logs no "missing translation" warnings for any of the three locale files
