## ADDED Requirements

### Requirement: Create customer profile
The system SHALL allow staff to create a customer profile scoped to their tenant.

#### Scenario: Successful customer creation
- **WHEN** staff calls `POST /api/v1/customers` with name, phone, identity_number
- **THEN** the system creates the customer with `tenant_id` from JWT

#### Scenario: Duplicate CCCD within tenant
- **WHEN** a customer with the same `identity_number` already exists in the tenant
- **THEN** the system returns HTTP 409 with error `IDENTITY_NUMBER_EXISTS` and the existing customer's ID

#### Scenario: Duplicate phone within tenant
- **WHEN** a customer with the same `phone` already exists in the tenant
- **THEN** the system returns HTTP 409 with error `PHONE_EXISTS` and the existing customer's ID

### Requirement: Search customers
The system SHALL allow searching customers by name, phone, or identity_number within the tenant.

#### Scenario: Search by phone
- **WHEN** `GET /api/v1/customers?phone=0912...` is called
- **THEN** the system returns paginated results filtered to `currentUser.tenantId`

### Requirement: Customer document upload
The system SHALL allow uploading CCCD front/back photos and portrait via presigned URL.

#### Scenario: Upload CCCD front
- **WHEN** staff requests a presigned URL for `entity_type=customer_id_front`
- **THEN** the system returns a presigned PUT URL with object key `tenants/{tenantId}/customers/{customerId}/id-front.jpg`

### Requirement: View customer contract history
The system SHALL display all contracts for a customer within the tenant.

#### Scenario: Customer with active contracts
- **WHEN** `GET /api/v1/customers/:id/contracts` is called
- **THEN** the system returns all contracts for that customer within `currentUser.tenantId`

#### Scenario: Customer with active contract warning
- **WHEN** a new contract is being created for a customer who already has an active contract
- **THEN** the system returns a warning in the response (not a block)
