## ADDED Requirements

### Requirement: Asset detail page
The system SHALL provide a dedicated detail page at `/assets/[id]` that shows full asset information, the linked contract (if any), and the linked customer.

#### Scenario: View asset with linked contract and customer
- **WHEN** a user navigates to `/assets/<id>`
- **THEN** the page SHALL display asset fields (assetName, assetType, brand, model, serialNumber, status, valuationAmount, proposedLoanAmount, conditionDescription)
- **THEN** the page SHALL display a contract card showing contractCode, status, principalAmount, startDate, dueDate with a clickable link to `/contracts/<contractId>`
- **THEN** the page SHALL display a customer card showing customerName with a clickable link to `/customers/<customerId>` (derived from the contract)

#### Scenario: View asset with no linked contract
- **WHEN** a user navigates to `/assets/<id>` and the asset has no active contract (contractId is null/absent)
- **THEN** the page SHALL display the asset fields
- **THEN** the page SHALL show an empty state in the contract section indicating no linked contract

#### Scenario: Loading state
- **WHEN** the page is fetching asset data
- **THEN** the page SHALL display a loading spinner or skeleton

### Requirement: Asset list page links to contracts
The system SHALL display a contract code column on the assets list page (`/assets`), and each contract code SHALL be a clickable link navigating to `/contracts/<contractId>`.

#### Scenario: Asset row with linked contract shows clickable code
- **WHEN** an asset in the list has a contractId
- **THEN** the row SHALL show the contract code as a `<Link>` to `/contracts/<contractId>`

#### Scenario: Asset row with no linked contract
- **WHEN** an asset in the list has no contractId
- **THEN** the contract code cell SHALL show a dash or empty value

### Requirement: Asset list status filter uses correct enum values
The asset status filter SHALL use the values matching the database enum: `holding`, `redeemed`, `overdue`, `pending_liquidation`, `liquidated`.

#### Scenario: Filter by holding status
- **WHEN** a user selects "holding" in the status filter
- **THEN** the list SHALL show only assets with status `holding`

### Requirement: Contract detail page asset links
Each asset row in the contract detail page SHALL be a clickable link navigating to `/assets/<assetId>`.

#### Scenario: Click asset row in contract detail
- **WHEN** a user views a contract detail page and clicks an asset row or link
- **THEN** the browser SHALL navigate to `/assets/<assetId>`

### Requirement: Customer detail page contract code links
On the customer detail page, each contract's code cell SHALL be a clickable `<Link>` navigating to `/contracts/<contractId>` (in addition to the existing "View" action link).

#### Scenario: Click contract code in customer detail
- **WHEN** a user views a customer detail page and clicks a contract code in the history table
- **THEN** the browser SHALL navigate to `/contracts/<contractId>`

### Requirement: Customer detail page asset summary
The customer detail page SHALL display a summary section listing all assets associated with the customer's contracts.

#### Scenario: Customer has assets via contracts
- **WHEN** a user views a customer detail page and the customer has contracts with assets
- **THEN** the page SHALL show an assets section listing assetName, assetType, status, and a link to `/assets/<assetId>` for each asset

#### Scenario: Customer has no assets
- **WHEN** a user views a customer detail page and no assets are linked to the customer
- **THEN** the assets section SHALL display an empty state
