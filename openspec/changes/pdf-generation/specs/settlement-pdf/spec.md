## ADDED Requirements

### Requirement: Settlement PDF endpoint returns settlement/close-out document
The system SHALL expose `GET /api/v1/transactions/settlement/:contractId/pdf` that generates a settlement slip for a contract in `settled` status, showing the complete fee breakdown and asset return confirmation.

#### Scenario: Successful settlement PDF generation
- **WHEN** an authenticated user with role `staff`, `store_manager`, `tenant_admin`, or `tenant_owner` requests `GET /api/v1/transactions/settlement/:contractId/pdf`
- **THEN** the system returns HTTP 200 with `Content-Type: application/pdf` and the settlement document

#### Scenario: Contract not yet settled
- **WHEN** the contract status is not `settled`
- **THEN** the system returns HTTP 400 with message `Settlement slip only available for settled contracts`

#### Scenario: Contract not found or out of scope
- **WHEN** the contract `:contractId` does not exist or belongs to a different tenant/store
- **THEN** the system returns HTTP 404

### Requirement: Settlement PDF document content
The settlement slip SHALL present the complete financial summary of the closed contract.

#### Scenario: Settlement PDF content
- **WHEN** a settlement PDF is generated
- **THEN** the document includes: store name/address/phone, settlement date, contract code, customer name/ID/phone, asset summary (type/name/serial), principal amount, total interest collected, late fee (if any), storage fee (if any), total fees, grand total paid, asset return confirmation statement, date asset returned, and dual signature lines (customer receipt + staff confirmation)

### Requirement: Settlement PDF optional MinIO save
The system SHALL support `?save=true` to persist the settlement PDF at `tenants/{tenantId}/pdfs/settlements/{contractId}.pdf`.

#### Scenario: Save settlement to MinIO
- **WHEN** `GET /api/v1/transactions/settlement/:contractId/pdf?save=true` is requested
- **THEN** the system saves the PDF and returns `{ "url": "<presignedUrl>", "fileId": "<uuid>" }`
