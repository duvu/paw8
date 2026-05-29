## ADDED Requirements

### Requirement: API reference covers all endpoint groups
docs/api-reference.md SHALL document all endpoints grouped by module: auth, tenants, stores, users, customers, assets, contracts, transactions, files, reports, audit.

#### Scenario: All modules are documented
- **WHEN** a developer reads the API reference
- **THEN** they find a section for every module with all its routes listed

### Requirement: Each endpoint entry includes method, path, auth, and description
Every endpoint in docs/api-reference.md SHALL include: HTTP method, full path (e.g. `POST /api/v1/auth/login`), authentication requirement (Public / JWT required / JWT + role), and a one-line description.

#### Scenario: Developer locates an endpoint
- **WHEN** a developer searches the API reference for "login"
- **THEN** they find `POST /api/v1/auth/login` with its auth requirement and description

### Requirement: API reference documents request and response shapes
For each endpoint, docs/api-reference.md SHALL document the request body schema (field name, type, required/optional) and the response body schema.

#### Scenario: Developer builds a request
- **WHEN** a developer wants to create a new customer
- **THEN** they find all required fields and their types in the API reference

### Requirement: API reference includes error codes
docs/api-reference.md SHALL include an Error Codes section listing all HTTP status codes used (400, 401, 403, 404, 409, 500) with descriptions and example error response shapes.

#### Scenario: Developer handles an error
- **WHEN** a developer receives a 409 response
- **THEN** the error codes section explains what 409 means in the context of this API (duplicate identity/phone)

### Requirement: API reference includes a curl example per module
docs/api-reference.md SHALL include at least one curl example per module group showing authentication and a representative call.

#### Scenario: Developer tests an endpoint
- **WHEN** a developer wants to quickly test an endpoint
- **THEN** they can copy and adapt a curl example from the API reference
