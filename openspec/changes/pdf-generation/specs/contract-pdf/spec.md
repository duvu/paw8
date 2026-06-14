## ADDED Requirements

### Requirement: Contract PDF endpoint returns pawn contract document
The system SHALL expose `GET /api/v1/contracts/:id/pdf` that generates and streams a PDF of the pawn contract identified by `:id`, scoped to the requesting user's tenant and allowed stores.

#### Scenario: Successful contract PDF generation
- **WHEN** an authenticated user with role `staff`, `store_manager`, `tenant_admin`, or `tenant_owner` requests `GET /api/v1/contracts/:id/pdf`
- **THEN** the system returns HTTP 200 with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="contract-{contractCode}.pdf"` containing the contract document

#### Scenario: Contract not found or out of scope
- **WHEN** the contract `:id` does not exist or belongs to a different tenant/store
- **THEN** the system returns HTTP 404

#### Scenario: Unauthorized role
- **WHEN** a user with role `accountant` requests the contract PDF
- **THEN** the system returns HTTP 403

### Requirement: Contract PDF document contains complete contract information
The generated pawn contract PDF SHALL include all legally required information.

#### Scenario: Contract PDF content
- **WHEN** a contract PDF is generated
- **THEN** the document includes: store name/address/phone, contract code, contract date, due date, customer full name, customer identity number, customer phone, customer address, asset type/name/brand/serial, valuation amount, loan amount (in digits AND Vietnamese words), interest rate, interest type, note/terms, and signature lines for both customer and staff

### Requirement: Contract PDF optional MinIO save
The system SHALL support `?save=true` query parameter to persist the generated PDF to MinIO and return a presigned URL.

#### Scenario: Save to MinIO
- **WHEN** `GET /api/v1/contracts/:id/pdf?save=true` is requested
- **THEN** the system saves the PDF at `tenants/{tenantId}/pdfs/contracts/{contractId}.pdf`, creates a file metadata record, and returns HTTP 200 JSON `{ "url": "<presignedUrl>", "fileId": "<uuid>" }`
