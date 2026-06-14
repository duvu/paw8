## ADDED Requirements

### Requirement: Submit buyer inquiry on active listing
Any unauthenticated user SHALL be able to submit a contact inquiry on an `active` marketplace listing.

#### Scenario: Successful inquiry submission
- **WHEN** `POST /api/v1/marketplace/public/listings/:id/inquiries` is called with `buyerName`, `buyerPhone`, and optional `message`
- **THEN** a `buyer_inquiries` record is created linked to the listing and tenant, and 201 is returned

#### Scenario: Inquiry blocked on non-active listing
- **WHEN** an inquiry is submitted on a `draft`, `sold`, or `cancelled` listing
- **THEN** system returns 404 (listing not publicly visible)

#### Scenario: Validation enforced on required fields
- **WHEN** `buyerName` or `buyerPhone` is missing from the inquiry body
- **THEN** system returns 400 with validation error details

#### Scenario: Rate limiting on inquiry endpoint
- **WHEN** more than 5 inquiry submissions are made from the same IP within 60 seconds
- **THEN** system returns 429 Too Many Requests

### Requirement: Staff can view inquiries on a listing
Authenticated store staff and managers SHALL be able to view all inquiries for a listing within their tenant.

#### Scenario: List inquiries for a listing
- **WHEN** `GET /api/v1/marketplace/listings/:id/inquiries` is called by an authenticated staff user
- **THEN** all inquiries for that listing are returned sorted by `created_at` descending, including `buyerName`, `buyerPhone`, `buyerEmail`, `message`, and `created_at`

#### Scenario: Cross-tenant inquiry access blocked
- **WHEN** a user from tenant A calls `GET /api/v1/marketplace/listings/:id/inquiries` for a listing belonging to tenant B
- **THEN** system returns 404

### Requirement: Inquiry submission is audit logged
Every submitted inquiry SHALL be recorded in the audit log.

#### Scenario: Audit log entry on inquiry creation
- **WHEN** a buyer inquiry is submitted successfully
- **THEN** an `audit_logs` entry is created with `action=buyer_inquiry_submitted`, `entity_type=marketplace_listing`, `entity_id=<listing_id>`, and `tenant_id` of the listing
