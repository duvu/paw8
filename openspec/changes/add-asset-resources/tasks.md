## 1. Asset API foundation

- [ ] 1.1 Define or update asset DTOs for create, update, search filters, and status change requests
- [ ] 1.2 Add or complete asset controller routes for list, detail, create, update, status update, and inventory view
- [ ] 1.3 Ensure route contracts align with `/assets`, `/assets/:id`, `/assets/:id/status`, and `/assets/inventory`

## 2. Tenant and store scope enforcement

- [ ] 2.1 Implement tenant-derived asset create and update flows without trusting client-supplied `tenant_id`
- [ ] 2.2 Enforce store-scope validation against `allowedStoreIds` for asset create, update, inventory, and status change flows
- [ ] 2.3 Add rejection handling for out-of-scope store access and unauthorized status changes

## 3. Asset management behavior

- [ ] 3.1 Implement asset persistence and retrieval for create, update, detail, and filtered list use cases
- [ ] 3.2 Support asset search by serial number, IMEI, and license plate where those fields exist
- [ ] 3.3 Implement controlled asset status transitions used by MVP1 contract and settlement workflows

## 4. Asset inventory behavior

- [ ] 4.1 Implement inventory query behavior that returns held assets by tenant and optional store filter
- [ ] 4.2 Persist and return asset inventory location fields such as location code and location note
- [ ] 4.3 Align active inventory visibility with contract lifecycle events that hold or release an asset

## 5. Cross-module integration

- [ ] 5.1 Wire asset lifecycle integration points with contract creation and settlement/redeem flows
- [ ] 5.2 Validate asset responses used by web and mobile contract-creation and lookup flows
- [ ] 5.3 Review files or shared helpers touched by asset workflows for tenant/store consistency

## 6. Verification and documentation

- [ ] 6.1 Add or update tests covering asset creation, scoped search, detail lookup, status changes, and inventory behavior
- [ ] 6.2 Verify asset endpoints and responses against the new OpenSpec requirements and scenarios
- [ ] 6.3 Sync API and architecture docs if implementation changes runtime contracts or closes current-state gaps
