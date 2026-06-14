## ADDED Requirements

### Requirement: Auth happy-path
The system SHALL return 201 with `accessToken`, `refreshToken`, and `expiresIn` on valid login credentials, and 200 on token refresh with a new access token, and 200 on logout.

#### Scenario: Successful login
- **WHEN** `POST /api/v1/auth/login` is called with valid email and password
- **THEN** response is HTTP 201 with body containing `accessToken` (non-empty string), `refreshToken` (non-empty string), and `expiresIn` (positive integer)

#### Scenario: Token refresh
- **WHEN** `POST /api/v1/auth/refresh` is called with a valid `refreshToken`
- **THEN** response is HTTP 201 with a new `accessToken`

#### Scenario: Logout
- **WHEN** `POST /api/v1/auth/logout` is called with a valid bearer token
- **THEN** response is HTTP 200

### Requirement: Tenant CRUD happy-path
The system SHALL allow a platform admin to create, read, and update tenants.

#### Scenario: Create tenant
- **WHEN** `POST /api/v1/tenants` is called by platform admin with valid name, code, and plan
- **THEN** response is HTTP 201 with the created tenant object including `id`, `name`, `code`, `status`

#### Scenario: Get tenant
- **WHEN** `GET /api/v1/tenants/:id` is called with a valid tenant id
- **THEN** response is HTTP 200 with the tenant object

### Requirement: Store CRUD happy-path
The system SHALL allow a tenant admin to create and retrieve stores within their tenant.

#### Scenario: Create store
- **WHEN** `POST /api/v1/stores` is called by tenant admin with valid name and code
- **THEN** response is HTTP 201 with the created store object including `id`, `name`, `code`, `status`

#### Scenario: List stores
- **WHEN** `GET /api/v1/stores` is called by tenant admin
- **THEN** response is HTTP 200 with an array of stores belonging to the caller's tenant

### Requirement: User CRUD happy-path
The system SHALL allow a tenant admin to create users and assign roles.

#### Scenario: Create user
- **WHEN** `POST /api/v1/users` is called by tenant admin with valid email, password, and role
- **THEN** response is HTTP 201 with the created user object including `id`, `email`, `role`

#### Scenario: List users
- **WHEN** `GET /api/v1/users` is called by tenant admin
- **THEN** response is HTTP 200 with an array of users in the caller's tenant

### Requirement: Customer CRUD happy-path
The system SHALL allow staff to create and search customers within their tenant scope.

#### Scenario: Create customer
- **WHEN** `POST /api/v1/customers` is called with valid `fullName`, `phone`, `identityNumber`
- **THEN** response is HTTP 201 with the created customer including `id`, `fullName`, `phone`

#### Scenario: Search customer by phone
- **WHEN** `GET /api/v1/customers?phone=<value>` is called
- **THEN** response is HTTP 200 with an array; the matching customer is present

### Requirement: Asset CRUD happy-path
The system SHALL allow staff to create and retrieve pawned assets.

#### Scenario: Create asset
- **WHEN** `POST /api/v1/assets` is called with valid `assetType`, `assetName`, `valuationAmount`, `storeId`
- **THEN** response is HTTP 201 with the created asset including `id`, `assetType`, `status`

#### Scenario: Get asset
- **WHEN** `GET /api/v1/assets/:id` is called with a valid asset id
- **THEN** response is HTTP 200 with the asset object

### Requirement: Contract happy-path
The system SHALL allow staff to create a pawn contract linking a customer and asset, and generate a contract code.

#### Scenario: Create contract
- **WHEN** `POST /api/v1/contracts` is called with valid `customerId`, `assetIds`, `storeId`, `principalAmount`, `interestRate`, `startDate`, `dueDate`
- **THEN** response is HTTP 201 with the created contract including `id`, `contractCode` (matching pattern `{storeCode}-{YYYYMM}-{seq}`), `status`

#### Scenario: List upcoming-due contracts
- **WHEN** `GET /api/v1/contracts/upcoming-due` is called by tenant admin
- **THEN** response is HTTP 200 with an array of contract objects

### Requirement: Transaction happy-path
The system SHALL allow staff to record financial transactions against a contract.

#### Scenario: Disbursement
- **WHEN** `POST /api/v1/transactions` is called with `transactionType: "disbursement"`, valid `contractId`, and `amount`
- **THEN** response is HTTP 201 with the created transaction including `id`, `transactionType`, `amount`

#### Scenario: Interest collection
- **WHEN** `POST /api/v1/transactions` is called with `transactionType: "interest_collection"`, valid `contractId`, and `amount`
- **THEN** response is HTTP 201 with transaction object

#### Scenario: Settlement calculation
- **WHEN** `POST /api/v1/transactions/calculate-settlement` is called with a valid `contractId`
- **THEN** response is HTTP 200 or 201 with `totalAmount` (number) in the body

### Requirement: File upload/download happy-path
The system SHALL issue presigned MinIO URLs for upload and download, storing file metadata on confirm.

#### Scenario: Request upload URL
- **WHEN** `POST /api/v1/files/upload-url` is called with valid `entityType`, `entityId`, `filename`, `mimeType`, `fileSize`
- **THEN** response is HTTP 201 with `uploadUrl` (non-empty string) and `objectKey`

#### Scenario: Confirm upload
- **WHEN** `POST /api/v1/files/confirm` is called with the `objectKey` returned from upload-url
- **THEN** response is HTTP 201 with file metadata including `id`

#### Scenario: Get download URL
- **WHEN** `GET /api/v1/files/:id/download-url` is called with a valid file id
- **THEN** response is HTTP 200 with `downloadUrl` (non-empty string)

### Requirement: Reports dashboard happy-path
The system SHALL return basic operational metrics for a tenant.

#### Scenario: Dashboard summary
- **WHEN** `GET /api/v1/reports/dashboard` is called by tenant admin
- **THEN** response is HTTP 200 with at minimum `activeContracts` and `totalOutstanding` numeric fields
