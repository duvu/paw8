## ADDED Requirements

### Requirement: Receipt PDF endpoint returns payment receipt document
The system SHALL expose `GET /api/v1/transactions/:id/receipt/pdf` that generates and streams a PDF receipt for the transaction identified by `:id`, scoped to the requesting user's tenant and allowed stores.

#### Scenario: Successful receipt PDF generation
- **WHEN** an authenticated user with role `staff`, `store_manager`, `tenant_admin`, or `tenant_owner` requests `GET /api/v1/transactions/:id/receipt/pdf`
- **THEN** the system returns HTTP 200 with `Content-Type: application/pdf` and a receipt document

#### Scenario: Transaction not found or out of scope
- **WHEN** the transaction `:id` does not exist or belongs to a different tenant/store
- **THEN** the system returns HTTP 404

#### Scenario: Non-receiptable transaction type
- **WHEN** the transaction type is `void` or `reversal`
- **THEN** the system returns HTTP 400 with message `Receipt not available for void/reversal transactions`

### Requirement: Receipt PDF document content
The generated payment receipt SHALL include all relevant transaction information.

#### Scenario: Receipt PDF content
- **WHEN** a receipt PDF is generated for any receiptable transaction type (disbursement, interest_collection, fee_collection, settlement, principal_partial)
- **THEN** the document includes: store name/address/phone, receipt number (transaction ID short form), date/time, customer name, contract code, transaction type (Vietnamese label), amount paid (digits + words), payment method (Vietnamese label), remaining balance (for non-settlement types), staff name, and acknowledgment/signature line

### Requirement: Receipt PDF optional MinIO save
The system SHALL support `?save=true` to persist the receipt PDF and return a presigned URL, following the same pattern as contract PDF.

#### Scenario: Save receipt to MinIO
- **WHEN** `GET /api/v1/transactions/:id/receipt/pdf?save=true` is requested
- **THEN** the system saves at `tenants/{tenantId}/pdfs/receipts/{transactionId}.pdf` and returns `{ "url": "<presignedUrl>", "fileId": "<uuid>" }`
