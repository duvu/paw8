## ADDED Requirements

### Requirement: Extension PDF endpoint returns contract extension slip
The system SHALL expose `GET /api/v1/contracts/:id/extension/pdf` that generates an extension slip for the most recent extension on the contract, showing the old/new due dates and fees collected.

#### Scenario: Successful extension PDF generation
- **WHEN** an authenticated user with role `staff`, `store_manager`, `tenant_admin`, or `tenant_owner` requests `GET /api/v1/contracts/:id/extension/pdf`
- **THEN** the system returns HTTP 200 with `Content-Type: application/pdf` and the extension slip document

#### Scenario: No extension found for contract
- **WHEN** the contract has never been extended (no record in `contract_extensions`)
- **THEN** the system returns HTTP 404 with message `No extension found for this contract`

#### Scenario: Contract not found or out of scope
- **WHEN** the contract `:id` does not exist or belongs to a different tenant/store
- **THEN** the system returns HTTP 404

### Requirement: Extension PDF document content
The extension slip SHALL document the terms of the latest extension.

#### Scenario: Extension PDF content
- **WHEN** an extension PDF is generated
- **THEN** the document includes: store name/address/phone, extension date, contract code, customer name/ID, asset summary, original due date, new due date, number of days extended, interest paid at extension (digits + words), extension fee if any, total collected at extension, new terms reminder (next due date, interest rate), and signature lines for customer acknowledgment and staff

### Requirement: Extension PDF optional MinIO save
The system SHALL support `?save=true` to persist the extension PDF at `tenants/{tenantId}/pdfs/extensions/{contractId}-{extensionId}.pdf`.

#### Scenario: Save extension to MinIO
- **WHEN** `GET /api/v1/contracts/:id/extension/pdf?save=true` is requested
- **THEN** the system saves the PDF and returns `{ "url": "<presignedUrl>", "fileId": "<uuid>" }`
